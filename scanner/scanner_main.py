"""
Main Scanner Entry Point
Unified interface for all scanning operations
"""

import json
import sys
import argparse
from port_scanner import scan_ports
from fingerprint import scan_fingerprint


def main():
    """Main entry point for scanner"""
    parser = argparse.ArgumentParser(description='YunSeeAI Asset Scanner')
    parser.add_argument('target', help='Target URL or hostname')
    parser.add_argument('--scan-type', choices=['port', 'fingerprint', 'full'], 
                       default='full', help='Type of scan to perform')
    parser.add_argument('--ports', default='common', 
                       help='Ports to scan: "common", "all", or comma-separated list')
    parser.add_argument('--timeout', type=float, default=5.0,
                       help='Timeout in seconds')
    parser.add_argument('--json', action='store_true',
                       help='Output in JSON format')
    
    args = parser.parse_args()
    
    results = {
        "target": args.target,
        "scan_type": args.scan_type,
        "success": True
    }
    
    try:
        # Perform port scan
        if args.scan_type in ['port', 'full']:
            port_result = scan_ports(args.target, args.ports, args.timeout)
            results['port_scan'] = port_result
            
            if not port_result.get('success'):
                results['success'] = False
        
        # Perform fingerprint scan
        if args.scan_type in ['fingerprint', 'full']:
            fingerprint_result = scan_fingerprint(args.target, int(args.timeout))
            results['fingerprint_scan'] = fingerprint_result
            
            if not fingerprint_result.get('success'):
                # Fingerprint failure shouldn't fail entire scan
                pass
        
        # Output results
        if args.json or True:  # Always output JSON for Node.js integration
            print(json.dumps(results, indent=2))
        else:
            print_human_readable(results)
            
    except Exception as e:
        error_result = {
            "success": False,
            "error": str(e),
            "target": args.target
        }
        print(json.dumps(error_result, indent=2))
        sys.exit(1)


def print_human_readable(results: dict):
    """Print results in human-readable format"""
    print(f"\n=== Scan Results for {results['target']} ===\n")
    
    if 'port_scan' in results:
        port_data = results['port_scan']
        if port_data.get('success'):
            print(f"Port Scan Results:")
            print(f"  Target IP: {port_data.get('target_ip')}")
            print(f"  Open Ports: {port_data.get('total_open')}/{port_data.get('total_scanned')}")
            
            for port in port_data.get('open_ports', []):
                banner = f" ({port['banner'][:50]}...)" if port.get('banner') else ""
                print(f"    {port['port']}/tcp - {port['service']}{banner}")
            print()
    
    if 'fingerprint_scan' in results:
        fp_data = results['fingerprint_scan']
        if fp_data.get('success'):
            print(f"Fingerprint Scan Results:")
            
            if fp_data.get('server_info'):
                print(f"  Server Info:")
                for key, value in fp_data['server_info'].items():
                    print(f"    {key}: {value}")
            
            if fp_data.get('technologies'):
                print(f"\n  Detected Technologies ({fp_data.get('total_detected')}):")
                for tech in fp_data['technologies']:
                    conf = tech.get('confidence', 'unknown')
                    tech_type = tech.get('type', 'Unknown')
                    print(f"    - {tech['name']} ({tech_type}) [confidence: {conf}]")
            else:
                print("  No specific technologies detected")
            
            if fp_data.get('cookies'):
                print(f"\n  Cookies: {', '.join(fp_data['cookies'])}")
            print()


if __name__ == "__main__":
    main()

