"""
WAF (Web Application Firewall) Scanner
Detects WAF presence and identifies WAF types using WAFW00F
"""

import json
import sys
import os
from typing import Dict, List, Optional

# Try to import wafw00f
try:
    # Add wafw00f to path
    wafw00f_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'wafw00f-2.3.1')
    if os.path.exists(wafw00f_path):
        sys.path.insert(0, wafw00f_path)
    
    from wafw00f.main import WAFW00F
    WAFW00F_AVAILABLE = True
except ImportError:
    WAFW00F_AVAILABLE = False
    print(json.dumps({
        "success": False,
        "error": "WAFW00F not available. Please install: pip install wafw00f"
    }), file=sys.stderr)


class WAFScanner:
    """WAF detection scanner using WAFW00F"""
    
    def __init__(self, target: str, timeout: int = 10):
        """
        Initialize WAF scanner
        
        Args:
            target: Target URL
            timeout: Request timeout in seconds
        """
        self.target = self._normalize_url(target)
        self.timeout = timeout
        
    def _normalize_url(self, url: str) -> str:
        """Ensure URL has proper scheme"""
        if not url.startswith(('http://', 'https://')):
            return 'https://' + url
        return url
    
    def scan(self) -> Dict:
        """
        Perform WAF detection scan
        
        Returns:
            Dictionary with scan results
        """
        if not WAFW00F_AVAILABLE:
            return {
                "success": False,
                "error": "WAFW00F library not available",
                "target": self.target
            }
        
        try:
            # Create WAFW00F instance
            attacker = WAFW00F(self.target)
            
            # Check if target is reachable
            if not attacker.normalRequest():
                return {
                    "success": False,
                    "error": "Target is not reachable or returned error",
                    "target": self.target
                }
            
            # Perform WAF detection
            waf_results = attacker.identwaf()
            
            # Parse results - WAFW00F returns list of WAF names (strings)
            detected_wafs = []
            if waf_results:
                # identwaf() returns a list of WAF names as strings
                # Filter out non-string values and invalid entries
                for waf in waf_results:
                    waf_name = str(waf).strip() if waf else None
                    
                    # Skip invalid names (URLs, empty strings, etc.)
                    if waf_name and not waf_name.startswith('http'):
                        detected_wafs.append({
                            "name": waf_name,
                            "confidence": "high"
                        })
            
            # Get generic detection info
            generic_detected = attacker.genericdetect()
            
            return {
                "success": True,
                "target": self.target,
                "waf_detected": len(detected_wafs) > 0 or generic_detected,
                "detected_wafs": detected_wafs,
                "total_detected": len(detected_wafs),
                "generic_detection": generic_detected,
                "summary": self._generate_summary(detected_wafs, generic_detected)
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"WAF detection failed: {str(e)}",
                "target": self.target
            }
    
    def _generate_summary(self, detected_wafs: List[Dict], generic_detected: bool) -> str:
        """Generate human-readable summary"""
        if detected_wafs:
            waf_names = [waf['name'] for waf in detected_wafs]
            return f"Detected {len(waf_names)} WAF(s): {', '.join(waf_names)}"
        elif generic_detected:
            return "Generic WAF detected (specific type unknown)"
        else:
            return "No WAF detected"


def scan_waf(target: str, timeout: int = 10) -> Dict:
    """
    Convenience function for WAF scanning
    
    Args:
        target: Target URL
        timeout: Timeout in seconds
        
    Returns:
        Scan results dictionary
    """
    scanner = WAFScanner(target, timeout)
    return scanner.scan()


def main():
    """Main entry point for CLI usage"""
    if len(sys.argv) < 2:
        print(json.dumps({
            "success": False,
            "error": "Usage: python waf_scanner.py <target_url>"
        }))
        sys.exit(1)
    
    target = sys.argv[1]
    result = scan_waf(target)
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()
