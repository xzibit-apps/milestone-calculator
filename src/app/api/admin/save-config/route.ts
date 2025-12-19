// app/api/admin/save-config/route.ts
// API route to save configuration changes to JSON files

import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import type { CIConfig } from '@/lib/calculator';
import type { TaskConfig } from '@/lib/types';

// Mark this route as dynamic
export const dynamic = 'force-dynamic';

interface LabelsConfig {
  infoGates: Record<string, string>;
  optionalFlags: Record<string, string>;
}

// Base64Url → JSON decode helper (Edge-compatible)
function decodeJwt(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const base64 = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(parts[1].length / 4) * 4, '=');

    const decoded = atob(base64);
    const json = decodeURIComponent(
      decoded
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(json);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err) {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Security: Verify admin role before allowing config save
    const token = request.cookies.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No authentication token found' },
        { status: 401 }
      );
    }

    const payload = decodeJwt(token);
    
    if (!payload) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    const userRole = payload.role || null;
    const isAdmin = userRole === 'admin';

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - Admin role required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { configType, data } = body;

    // Validate request
    if (!configType || !data) {
      return NextResponse.json(
        { error: 'Missing configType or data' },
        { status: 400 }
      );
    }

    // Get the project root directory
    const projectRoot = process.cwd();
    const configDir = join(projectRoot, 'src', 'config');

    let filePath: string;
    let fileData: CIConfig | TaskConfig[] | LabelsConfig;

    // Determine which file to write based on configType
    switch (configType) {
      case 'ciConfig':
        filePath = join(configDir, 'ciConfig.json');
        fileData = data;
        break;
      case 'tasks':
        filePath = join(configDir, 'tasks.json');
        fileData = data;
        break;
      case 'labels':
        filePath = join(configDir, 'labels.json');
        fileData = data;
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid configType. Must be: ciConfig, tasks, or labels' },
          { status: 400 }
        );
    }

    // Validate data structure (basic validation)
    if (configType === 'ciConfig') {
      if (!data.weights || !data.thresholds) {
        return NextResponse.json(
          { error: 'Invalid ciConfig structure' },
          { status: 400 }
        );
      }
    } else if (configType === 'tasks') {
      if (!Array.isArray(data)) {
        return NextResponse.json(
          { error: 'Tasks must be an array' },
          { status: 400 }
        );
      }
      // Validate each task has required fields
      const taskIds = new Set<string>();
      for (const task of data) {
        if (!task.id || !task.name || task.durationLow === undefined) {
          return NextResponse.json(
            { error: `Invalid task structure: ${task.id || 'unknown'}` },
            { status: 400 }
          );
        }
        // Require unique id per task
        if (taskIds.has(task.id)) {
          return NextResponse.json(
            { error: `Duplicate task id: ${task.id}. Each task must have a unique id.` },
            { status: 400 }
          );
        }
        taskIds.add(task.id);
        // Ensure at least one scopeCondition
        if (!task.scopeConditions || task.scopeConditions.length === 0) {
          return NextResponse.json(
            { error: `Task ${task.id} must have at least one scopeCondition` },
            { status: 400 }
          );
        }
        // Prevent negative durations
        if (task.durationLow < 0 || task.durationMedium < 0 || task.durationHigh < 0) {
          return NextResponse.json(
            { error: `Task ${task.id} cannot have negative durations` },
            { status: 400 }
          );
        }
        // Warn (but do not fail) if successFactor is blank - log to console
        if (!task.successFactor || task.successFactor.trim() === '') {
          console.warn(`Task ${task.id} has blank successFactor. Consider adding guidance text.`);
        }
      }
    } else if (configType === 'labels') {
      if (!data.infoGates || !data.optionalFlags) {
        return NextResponse.json(
          { error: 'Invalid labels structure' },
          { status: 400 }
        );
      }
    }

    // Write to file with pretty formatting
    const jsonContent = JSON.stringify(fileData, null, 2);
    await writeFile(filePath, jsonContent, 'utf-8');

    return NextResponse.json({
      success: true,
      message: `${configType} saved successfully`,
      filePath: filePath,
    });
  } catch (error) {
    console.error('Error saving config:', error);
    return NextResponse.json(
      {
        error: 'Failed to save configuration',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
