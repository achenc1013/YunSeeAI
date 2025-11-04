/**
 * Scanner Client - Node.js Integration Layer
 * Provides interface for calling Python scanner tools
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Execute Python scanner script
 * @param {string} scriptName - Name of the Python script
 * @param {Array<string>} args - Command line arguments
 * @returns {Promise<Object>} - Parsed JSON result
 */
async function executePythonScript(scriptName, args) {
  return new Promise((resolve, reject) => {
    const scriptPath = join(__dirname, scriptName);
    const pythonProcess = spawn('python', [scriptPath, ...args]);
    
    let stdout = '';
    let stderr = '';
    
    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      if (code !== 0 && stderr) {
        reject(new Error(`Python script failed: ${stderr}`));
        return;
      }
      
      try {
        const result = JSON.parse(stdout);
        resolve(result);
      } catch (error) {
        reject(new Error(`Failed to parse scanner output: ${error.message}`));
      }
    });
    
    pythonProcess.on('error', (error) => {
      reject(new Error(`Failed to start Python process: ${error.message}`));
    });
  });
}

/**
 * Scan ports on target
 * @param {string} target - Target hostname or URL
 * @param {string} ports - Port specification: "common", "all", or comma-separated list
 * @param {number} timeout - Timeout in seconds
 * @returns {Promise<Object>} - Port scan results
 */
export async function scanPorts(target, ports = 'common', timeout = 5) {
  try {
    const result = await executePythonScript('port_scanner.py', [
      target,
      ports,
      timeout.toString()
    ]);
    return result;
  } catch (error) {
    return {
      success: false,
      error: error.message,
      target
    };
  }
}

/**
 * Scan web fingerprint/framework
 * @param {string} target - Target URL
 * @param {number} timeout - Timeout in seconds
 * @returns {Promise<Object>} - Fingerprint scan results
 */
export async function scanFingerprint(target, timeout = 10) {
  try {
    const result = await executePythonScript('fingerprint.py', [
      target,
      timeout.toString()
    ]);
    return result;
  } catch (error) {
    return {
      success: false,
      error: error.message,
      target
    };
  }
}

/**
 * Perform full scan (ports + fingerprint)
 * @param {string} target - Target hostname or URL
 * @param {Object} options - Scan options
 * @returns {Promise<Object>} - Complete scan results
 */
export async function scanFull(target, options = {}) {
  const {
    ports = 'common',
    timeout = 10
  } = options;
  
  try {
    const result = await executePythonScript('scanner_main.py', [
      target,
      '--scan-type', 'full',
      '--ports', ports,
      '--timeout', timeout.toString(),
      '--json'
    ]);
    return result;
  } catch (error) {
    return {
      success: false,
      error: error.message,
      target
    };
  }
}

/**
 * Scan for vulnerabilities (CVEs) based on fingerprint data
 * @param {string} target - Target URL
 * @param {Object} fingerprintData - Fingerprint scan results (optional, will scan if not provided)
 * @param {boolean} online - Enable online CVE queries (default: true)
 * @returns {Promise<Object>} - CVE scan results
 */
export async function scanVulnerabilities(target, fingerprintData = null, online = true) {
  try {
    // If no fingerprint data, scan first
    if (!fingerprintData) {
      fingerprintData = await scanFingerprint(target);
      if (!fingerprintData.success) {
        return {
          success: false,
          error: 'Failed to get fingerprint data: ' + fingerprintData.error,
          target
        };
      }
    }
    
    // Prepare arguments
    const args = [JSON.stringify(fingerprintData)];
    if (!online) {
      args.push('--offline');
    }
    
    const result = await executePythonScript('cve_scanner.py', args);
    return result;
  } catch (error) {
    return {
      success: false,
      error: error.message,
      target
    };
  }
}

/**
 * Format scan results for AI consumption
 * @param {Object} scanResult - Raw scan results
 * @returns {string} - Formatted text summary
 */
export function formatScanResults(scanResult) {
  if (!scanResult.success) {
    return `Scan failed: ${scanResult.error}`;
  }
  
  let summary = `Scan results for ${scanResult.target}:\n\n`;
  
  // Port scan results
  if (scanResult.port_scan) {
    const portData = scanResult.port_scan;
    if (portData.success) {
      summary += `Port Scan:\n`;
      summary += `  Target IP: ${portData.target_ip}\n`;
      summary += `  Open Ports: ${portData.total_open} out of ${portData.total_scanned} scanned\n`;
      
      if (portData.open_ports && portData.open_ports.length > 0) {
        summary += `  Detected open ports:\n`;
        portData.open_ports.forEach(port => {
          summary += `    - Port ${port.port} (${port.service}): ${port.state}\n`;
          if (port.banner) {
            summary += `      Banner: ${port.banner.substring(0, 100)}\n`;
          }
        });
      } else {
        summary += `  No open ports found in the scanned range.\n`;
      }
      summary += `\n`;
    }
  }
  
  // Fingerprint scan results
  if (scanResult.fingerprint_scan) {
    const fpData = scanResult.fingerprint_scan;
    if (fpData.success) {
      summary += `Fingerprint Scan:\n`;
      
      if (fpData.server_info && Object.keys(fpData.server_info).length > 0) {
        summary += `  Server Information:\n`;
        Object.entries(fpData.server_info).forEach(([key, value]) => {
          summary += `    ${key}: ${value}\n`;
        });
      }
      
      if (fpData.technologies && fpData.technologies.length > 0) {
        summary += `  Detected Technologies (${fpData.total_detected}):\n`;
        fpData.technologies.forEach(tech => {
          summary += `    - ${tech.name} (${tech.type}) [confidence: ${tech.confidence}]\n`;
          if (tech.detected_path) {
            summary += `      Detected at: ${tech.detected_path}\n`;
          }
        });
      } else {
        summary += `  No specific frameworks or CMS detected.\n`;
      }
      
      if (fpData.cookies && fpData.cookies.length > 0) {
        summary += `  Cookies found: ${fpData.cookies.join(', ')}\n`;
      }
    }
  }
  
  return summary;
}

// Export all functions
export default {
  scanPorts,
  scanFingerprint,
  scanFull,
  scanVulnerabilities,
  formatScanResults
};

