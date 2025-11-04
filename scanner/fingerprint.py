"""
Web Fingerprint Scanner
Identifies web frameworks, CMS, and technologies used by a website
"""

import re
import json
import sys
import ssl
from urllib.parse import urlparse, urljoin
from typing import Dict, List, Set
import socket


try:
    import urllib.request as urllib_request
    from urllib.error import URLError, HTTPError
except ImportError:
    print(json.dumps({"success": False, "error": "urllib not available"}))
    sys.exit(1)


class FingerprintScanner:
    """Web application fingerprint scanner"""
    
    # Framework/CMS fingerprints (Enhanced with more CMS systems)
    FINGERPRINTS = {
        # ===== International CMS =====
        
        # WordPress - Most popular CMS
        "WordPress": {
            "paths": ["/wp-admin/", "/wp-content/", "/wp-includes/", "/wp-login.php", "/xmlrpc.php"],
            "headers": {},
            "body_patterns": ["wp-content", "wp-includes", "WordPress", "wp-json"],
            "meta_tags": ["generator.*WordPress"],
            "cookies": ["wordpress_", "wp-settings"]
        },
        
        # Joomla - Second most popular
        "Joomla": {
            "paths": ["/administrator/", "/components/", "/modules/", "/templates/"],
            "headers": {},
            "body_patterns": ["Joomla!", "/media/jui/", "com_content"],
            "meta_tags": ["generator.*Joomla"],
            "cookies": []
        },
        
        # Drupal - Enterprise CMS
        "Drupal": {
            "paths": ["/sites/default/", "/misc/drupal.js", "/core/", "/modules/"],
            "headers": {"X-Drupal-Cache": ".*", "X-Generator": "Drupal.*"},
            "body_patterns": ["Drupal", "/sites/default/", "drupal.js"],
            "meta_tags": ["generator.*Drupal"],
            "cookies": ["SESS"]
        },
        
        # ===== Chinese CMS (国产CMS) =====
        
        # Discuz - 康盛论坛系统
        "Discuz": {
            "paths": ["/forum.php", "/admin.php", "/member.php", "/static/image/common/"],
            "headers": {},
            "body_patterns": ["Discuz!", "Comsenz", "discuz_uid", "home.php?mod=space"],
            "meta_tags": [],
            "cookies": ["discuz"]
        },
        
        # DedeCMS (织梦CMS) - Popular Chinese CMS
        "DedeCMS": {
            "paths": ["/plus/", "/templets/", "/data/", "/dede/"],
            "headers": {},
            "body_patterns": ["DedeCMS", "织梦", "Power by DedeCms", "/templets/default/"],
            "meta_tags": ["generator.*DedeCMS"],
            "cookies": ["DedeUserID"]
        },
        
        # PHPCMS - 盛大CMS
        "PHPCMS": {
            "paths": ["/phpcms/", "/statics/", "/index.php?m=content"],
            "headers": {},
            "body_patterns": ["PHPCMS", "phpcms.cn"],
            "meta_tags": [],
            "cookies": []
        },
        
        # EmpireCMS (帝国CMS)
        "EmpireCMS": {
            "paths": ["/e/admin/", "/e/data/", "/e/class/"],
            "headers": {},
            "body_patterns": ["EmpireCMS", "帝国", "/e/data/"],
            "meta_tags": [],
            "cookies": []
        },
        
        # Typecho - Lightweight blog
        "Typecho": {
            "paths": ["/admin/", "/usr/themes/", "/usr/plugins/"],
            "headers": {},
            "body_patterns": ["Typecho", "typecho"],
            "meta_tags": ["generator.*Typecho"],
            "cookies": ["__typecho"]
        },
        
        # Z-Blog - ASP/PHP blog
        "Z-Blog": {
            "paths": ["/zb_users/", "/zb_system/"],
            "headers": {},
            "body_patterns": ["Z-Blog", "zblog", "zb_users"],
            "meta_tags": ["generator.*Z-Blog"],
            "cookies": []
        },
        
        # ===== E-commerce CMS =====
        
        # Shopify
        "Shopify": {
            "paths": ["/cart", "/checkout"],
            "headers": {"X-Shopify-Stage": ".*"},
            "body_patterns": ["Shopify", "shopify.com", "cdn.shopify.com"],
            "meta_tags": [],
            "cookies": ["_shopify"]
        },
        
        # Magento
        "Magento": {
            "paths": ["/skin/frontend/", "/js/mage/", "/media/catalog/"],
            "headers": {"X-Magento": ".*"},
            "body_patterns": ["Magento", "Mage.Cookies", "/skin/frontend/"],
            "meta_tags": [],
            "cookies": []
        },
        
        # WooCommerce (WordPress plugin)
        "WooCommerce": {
            "paths": ["/wp-content/plugins/woocommerce/"],
            "headers": {},
            "body_patterns": ["woocommerce", "WooCommerce"],
            "meta_tags": [],
            "cookies": []
        },
        
        # ===== Forum/Community CMS =====
        
        # phpBB
        "phpBB": {
            "paths": ["/viewtopic.php", "/memberlist.php"],
            "headers": {},
            "body_patterns": ["phpBB", "Powered by phpBB"],
            "meta_tags": [],
            "cookies": ["phpbb"]
        },
        
        # vBulletin
        "vBulletin": {
            "paths": ["/showthread.php", "/forumdisplay.php"],
            "headers": {},
            "body_patterns": ["vBulletin", "vbulletin"],
            "meta_tags": ["generator.*vBulletin"],
            "cookies": []
        },
        
        # ===== Other Popular CMS =====
        
        # Ghost - Modern blog platform
        "Ghost": {
            "paths": ["/ghost/", "/content/themes/"],
            "headers": {},
            "body_patterns": ["ghost", "ghost.org"],
            "meta_tags": ["generator.*Ghost"],
            "cookies": ["ghost"]
        },
        
        # Hexo - Static site generator
        "Hexo": {
            "paths": [],
            "headers": {},
            "body_patterns": ["Hexo", "hexo.io"],
            "meta_tags": ["generator.*Hexo"],
            "cookies": []
        },
        
        # Hugo - Static site generator
        "Hugo": {
            "paths": [],
            "headers": {},
            "body_patterns": ["Hugo", "gohugo.io"],
            "meta_tags": ["generator.*Hugo"],
            "cookies": []
        },
        
        # Jekyll - Static site generator
        "Jekyll": {
            "paths": [],
            "headers": {},
            "body_patterns": ["Jekyll", "jekyllrb.com"],
            "meta_tags": ["generator.*Jekyll"],
            "cookies": []
        },
        
        # Frameworks
        "Laravel": {
            "paths": [],
            "headers": {"X-Powered-By": ".*PHP.*"},
            "body_patterns": ["laravel_session", "XSRF-TOKEN"],
            "cookies": ["laravel_session", "XSRF-TOKEN"]
        },
        "Django": {
            "paths": ["/admin/", "/static/admin/"],
            "headers": {"X-Frame-Options": ".*"},
            "body_patterns": ["csrfmiddlewaretoken", "__admin_media_prefix__"],
            "cookies": ["csrftoken", "sessionid"]
        },
        "Flask": {
            "paths": [],
            "headers": {"Server": ".*Werkzeug.*"},
            "body_patterns": [],
            "cookies": ["session"]
        },
        "Express": {
            "paths": [],
            "headers": {"X-Powered-By": "Express"},
            "body_patterns": [],
            "cookies": ["connect.sid"]
        },
        "Spring": {
            "paths": [],
            "headers": {"X-Application-Context": ".*"},
            "body_patterns": ["Whitelabel Error Page", "Spring"],
            "cookies": ["JSESSIONID"]
        },
        "ASP.NET": {
            "paths": [],
            "headers": {"X-Powered-By": "ASP.NET", "X-AspNet-Version": ".*"},
            "body_patterns": ["__VIEWSTATE", "__EVENTVALIDATION"],
            "cookies": ["ASP.NET_SessionId"]
        },
        
        # Web Servers
        "Nginx": {
            "paths": [],
            "headers": {"Server": "nginx"},
            "body_patterns": ["nginx"]
        },
        "Apache": {
            "paths": [],
            "headers": {"Server": "Apache"},
            "body_patterns": []
        },
        "IIS": {
            "paths": [],
            "headers": {"Server": "Microsoft-IIS"},
            "body_patterns": []
        },
        
        # Others
        "React": {
            "paths": [],
            "headers": {},
            "body_patterns": ["react", "_react", "data-reactroot", "data-reactid"]
        },
        "Vue.js": {
            "paths": [],
            "headers": {},
            "body_patterns": ["vue.js", "data-v-", "__vue__"]
        },
        "jQuery": {
            "paths": [],
            "headers": {},
            "body_patterns": ["jquery", "jQuery"]
        },
        "Bootstrap": {
            "paths": [],
            "headers": {},
            "body_patterns": ["bootstrap", "Bootstrap"]
        }
    }
    
    def __init__(self, target: str, timeout: int = 10):
        """
        Initialize fingerprint scanner
        
        Args:
            target: Target URL
            timeout: Request timeout in seconds
        """
        self.target = self._normalize_url(target)
        self.timeout = timeout
        self.detected = []
        self.headers = {}
        self.cookies = {}
        
    def _normalize_url(self, url: str) -> str:
        """Ensure URL has proper scheme"""
        if not url.startswith(('http://', 'https://')):
            return 'https://' + url
        return url
    
    def _make_request(self, url: str) -> Dict:
        """
        Make HTTP request with error handling
        
        Returns:
            Dictionary with status, headers, body, and cookies
        """
        try:
            # Debug: Print actual request URL
            import sys
            print(f"[DEBUG] Making request to: {url}", file=sys.stderr)
            
            # Create SSL context that doesn't verify certificates (for testing)
            ctx = ssl.create_default_context()
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE
            
            req = urllib_request.Request(url, headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            })
            
            with urllib_request.urlopen(req, timeout=self.timeout, context=ctx) as response:
                headers = dict(response.headers)
                body = response.read().decode('utf-8', errors='ignore')
                
                # Extract cookies
                cookies = {}
                if 'Set-Cookie' in headers:
                    cookie_str = headers['Set-Cookie']
                    for cookie in cookie_str.split(','):
                        parts = cookie.split(';')[0].split('=')
                        if len(parts) >= 2:
                            cookies[parts[0].strip()] = parts[1].strip()
                
                return {
                    "success": True,
                    "status": response.status,
                    "headers": headers,
                    "body": body,
                    "cookies": cookies
                }
                
        except HTTPError as e:
            return {
                "success": False,
                "status": e.code,
                "error": str(e)
            }
        except URLError as e:
            return {
                "success": False,
                "error": f"Connection error: {str(e.reason)}"
            }
        except socket.timeout:
            return {
                "success": False,
                "error": "Request timeout"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def _check_fingerprint(self, name: str, fingerprint: Dict, response: Dict) -> bool:
        """Check if a fingerprint matches the response"""
        if not response.get("success"):
            return False
            
        matches = 0
        checks = 0
        
        headers = response.get("headers", {})
        body = response.get("body", "")
        cookies = response.get("cookies", {})
        
        # Check headers
        if fingerprint.get("headers"):
            for header, pattern in fingerprint["headers"].items():
                checks += 1
                if header in headers:
                    if re.search(pattern, headers[header], re.IGNORECASE):
                        matches += 1
        
        # Check body patterns
        if fingerprint.get("body_patterns"):
            for pattern in fingerprint["body_patterns"]:
                checks += 1
                if re.search(pattern, body, re.IGNORECASE):
                    matches += 1
                    break  # One match is enough for body patterns
        
        # Check meta tags
        if fingerprint.get("meta_tags"):
            for pattern in fingerprint["meta_tags"]:
                checks += 1
                if re.search(pattern, body, re.IGNORECASE):
                    matches += 1
                    break
        
        # Check cookies
        if fingerprint.get("cookies"):
            for cookie_name in fingerprint["cookies"]:
                checks += 1
                if cookie_name in cookies:
                    matches += 1
                    break
        
        # Consider it a match if any check passed
        return matches > 0 if checks > 0 else False
    
    def scan(self) -> Dict:
        """
        Perform fingerprint scan
        
        Returns:
            Dictionary with scan results
        """
        # Debug: Print the target URL being scanned
        import sys
        print(f"[DEBUG] Scanning target: {self.target}", file=sys.stderr)
        
        # First, request the main page
        main_response = self._make_request(self.target)
        
        if not main_response.get("success") and main_response.get("status") != 404:
            return {
                "success": False,
                "error": main_response.get("error", "Failed to connect to target"),
                "target": self.target
            }
        
        self.headers = main_response.get("headers", {})
        self.cookies = main_response.get("cookies", {})
        
        detected_technologies = []
        
        # Check each fingerprint
        for name, fingerprint in self.FINGERPRINTS.items():
            # Check main page
            if self._check_fingerprint(name, fingerprint, main_response):
                detected_technologies.append({
                    "name": name,
                    "confidence": "high",
                    "type": self._get_tech_type(name)
                })
                continue
            
            # Check specific paths if defined
            if fingerprint.get("paths"):
                for path in fingerprint["paths"]:
                    test_url = urljoin(self.target, path)
                    path_response = self._make_request(test_url)
                    
                    if path_response.get("success") or path_response.get("status") == 403:
                        detected_technologies.append({
                            "name": name,
                            "confidence": "medium",
                            "type": self._get_tech_type(name),
                            "detected_path": path
                        })
                        break
        
        # Extract server and framework info from headers
        server_info = {}
        if "Server" in self.headers:
            server_info["server"] = self.headers["Server"]
        if "X-Powered-By" in self.headers:
            server_info["powered_by"] = self.headers["X-Powered-By"]
        
        return {
            "success": True,
            "target": self.target,
            "technologies": detected_technologies,
            "server_info": server_info,
            "headers": self.headers,
            "cookies": list(self.cookies.keys()),
            "total_detected": len(detected_technologies)
        }
    
    def _get_tech_type(self, name: str) -> str:
        """Get technology type (Enhanced with more CMS categories)"""
        cms = [
            "WordPress", "Joomla", "Drupal",  # International CMS
            "Discuz", "DedeCMS", "PHPCMS", "EmpireCMS", "Typecho", "Z-Blog",  # Chinese CMS
            "Shopify", "Magento", "WooCommerce",  # E-commerce
            "phpBB", "vBulletin",  # Forum
            "Ghost", "Hexo", "Hugo", "Jekyll"  # Blog/Static
        ]
        frameworks = ["Laravel", "Django", "Flask", "Express", "Spring", "ASP.NET"]
        servers = ["Nginx", "Apache", "IIS"]
        frontend = ["React", "Vue.js", "jQuery", "Bootstrap"]
        
        if name in cms:
            return "CMS"
        elif name in frameworks:
            return "Framework"
        elif name in servers:
            return "Web Server"
        elif name in frontend:
            return "Frontend"
        else:
            return "Other"


def scan_fingerprint(target: str, timeout: int = 10) -> Dict:
    """
    Convenience function for fingerprint scanning
    
    Args:
        target: Target URL
        timeout: Timeout in seconds
        
    Returns:
        Scan results dictionary
    """
    scanner = FingerprintScanner(target, timeout)
    return scanner.scan()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({
            "success": False,
            "error": "Usage: python fingerprint.py <target> [timeout]"
        }))
        sys.exit(1)
    
    target = sys.argv[1]
    timeout = int(sys.argv[2]) if len(sys.argv) > 2 else 10
    
    result = scan_fingerprint(target, timeout)
    print(json.dumps(result, indent=2))

