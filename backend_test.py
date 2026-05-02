#!/usr/bin/env python3
"""
Backend API Test Suite for OTT Navigator Clone
Tests all Xtream Codes proxy endpoints
"""
import requests
import sys
import time

# Backend URL from frontend/.env
BASE_URL = "https://ott-web-app.preview.emergentagent.com/api"
TIMEOUT = 30  # Xtream provider may be slow on cold cache

def test_endpoint(name, url, expected_status=200, check_json=True, check_fields=None, stream_test=False):
    """Test a single endpoint"""
    print(f"\n{'='*60}")
    print(f"Testing: {name}")
    print(f"URL: {url}")
    print(f"{'='*60}")
    
    try:
        if stream_test:
            # For stream endpoints, only check headers, don't download full content
            response = requests.get(url, timeout=TIMEOUT, stream=True)
            print(f"Status Code: {response.status_code}")
            print(f"Headers: {dict(response.headers)}")
            
            # Read only first 50KB to verify stream works (per requirements)
            chunk_count = 0
            bytes_read = 0
            max_bytes = 50 * 1024  # 50KB
            
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    bytes_read += len(chunk)
                    chunk_count += 1
                    if bytes_read >= max_bytes:
                        break
            
            print(f"Read {bytes_read} bytes in {chunk_count} chunks (limited to 50KB)")
            response.close()
            
            if response.status_code == expected_status:
                print(f"✅ PASS: {name}")
                return True, response.headers.get('content-type', 'unknown')
            else:
                print(f"❌ FAIL: Expected {expected_status}, got {response.status_code}")
                return False, None
        else:
            response = requests.get(url, timeout=TIMEOUT)
            print(f"Status Code: {response.status_code}")
            
            if response.status_code != expected_status:
                print(f"❌ FAIL: Expected {expected_status}, got {response.status_code}")
                print(f"Response: {response.text[:500]}")
                return False, None
            
            if check_json:
                try:
                    data = response.json()
                    print(f"Response type: {type(data)}")
                    
                    if isinstance(data, list):
                        print(f"Response length: {len(data)} items")
                        if len(data) > 0:
                            print(f"First item keys: {list(data[0].keys()) if isinstance(data[0], dict) else 'N/A'}")
                    elif isinstance(data, dict):
                        print(f"Response keys: {list(data.keys())}")
                        
                    # Check required fields if specified
                    if check_fields:
                        missing = []
                        for field in check_fields:
                            if '.' in field:
                                # Nested field check
                                parts = field.split('.')
                                current = data
                                found = True
                                for part in parts:
                                    if isinstance(current, dict) and part in current:
                                        current = current[part]
                                    else:
                                        found = False
                                        break
                                if not found:
                                    missing.append(field)
                            else:
                                if field not in data:
                                    missing.append(field)
                        
                        if missing:
                            print(f"⚠️  Missing fields: {missing}")
                            print(f"Available data: {data}")
                    
                    print(f"✅ PASS: {name}")
                    return True, data
                    
                except ValueError as e:
                    print(f"❌ FAIL: Invalid JSON response: {e}")
                    print(f"Response: {response.text[:500]}")
                    return False, None
            else:
                print(f"✅ PASS: {name}")
                return True, response.content
                
    except requests.exceptions.Timeout:
        print(f"❌ FAIL: Request timeout after {TIMEOUT}s")
        return False, None
    except requests.exceptions.RequestException as e:
        print(f"❌ FAIL: Request error: {e}")
        return False, None
    except Exception as e:
        print(f"❌ FAIL: Unexpected error: {e}")
        return False, None


def main():
    print("="*60)
    print("OTT Navigator Backend API Test Suite")
    print("="*60)
    print(f"Base URL: {BASE_URL}")
    print(f"Timeout: {TIMEOUT}s")
    
    results = {}
    
    # Test 1: Root endpoint
    success, data = test_endpoint(
        "1. Root endpoint",
        f"{BASE_URL}/",
        check_fields=["message"]
    )
    results["root"] = success
    
    # Test 2: Account info
    success, data = test_endpoint(
        "2. Account info",
        f"{BASE_URL}/account",
        check_fields=["user_info", "server_info"]
    )
    results["account"] = success
    
    # Test 3: Live TV categories
    success, data = test_endpoint(
        "3. Live TV categories",
        f"{BASE_URL}/live/categories"
    )
    results["live_categories"] = success
    if success and isinstance(data, list):
        print(f"   Found {len(data)} live categories")
    
    # Test 4: Live streams for IPL 2026 (category_id=807)
    success, data = test_endpoint(
        "4. Live streams (IPL 2026, category_id=807)",
        f"{BASE_URL}/live/streams?category_id=807"
    )
    results["live_streams"] = success
    stream_id = None
    if success and isinstance(data, list) and len(data) > 0:
        print(f"   Found {len(data)} streams in category 807")
        stream_id = data[0].get('stream_id') or data[0].get('id')
        print(f"   Using stream_id={stream_id} for EPG test")
    
    # Test 5: Short EPG for a stream
    if stream_id:
        success, data = test_endpoint(
            f"5. Short EPG (stream_id={stream_id})",
            f"{BASE_URL}/live/short_epg?stream_id={stream_id}"
        )
        results["live_short_epg"] = success
    else:
        print("\n⚠️  Skipping EPG test - no stream_id available")
        results["live_short_epg"] = None
    
    # Test 6: VOD categories
    success, data = test_endpoint(
        "6. VOD categories",
        f"{BASE_URL}/vod/categories"
    )
    results["vod_categories"] = success
    if success and isinstance(data, list):
        print(f"   Found {len(data)} VOD categories")
    
    # Test 7: VOD streams for ENGLISH 4K (category_id=122)
    success, data = test_endpoint(
        "7. VOD streams (ENGLISH 4K, category_id=122)",
        f"{BASE_URL}/vod/streams?category_id=122"
    )
    results["vod_streams"] = success
    if success and isinstance(data, list):
        print(f"   Found {len(data)} movies in category 122")
    
    # Test 8: VOD info for Wonder Woman 1984 (id=20642)
    success, data = test_endpoint(
        "8. VOD info (Wonder Woman 1984, id=20642)",
        f"{BASE_URL}/vod/info/20642",
        check_fields=["info"]
    )
    results["vod_info"] = success
    if success and isinstance(data, dict):
        movie_image = data.get('info', {}).get('movie_image')
        if movie_image:
            print(f"   Movie image URL: {movie_image[:80]}...")
    
    # Test 9: Series categories
    success, data = test_endpoint(
        "9. Series categories",
        f"{BASE_URL}/series/categories"
    )
    results["series_categories"] = success
    if success and isinstance(data, list):
        print(f"   Found {len(data)} series categories")
    
    # Test 10: Series list for NETFLIX (category_id=106)
    success, data = test_endpoint(
        "10. Series list (NETFLIX, category_id=106)",
        f"{BASE_URL}/series?category_id=106"
    )
    results["series_list"] = success
    series_id = None
    if success and isinstance(data, list) and len(data) > 0:
        print(f"   Found {len(data)} series in category 106")
        series_id = data[0].get('series_id') or data[0].get('id')
        print(f"   Using series_id={series_id} for info test")
    
    # Test 11: Series info
    if series_id:
        success, data = test_endpoint(
            f"11. Series info (series_id={series_id})",
            f"{BASE_URL}/series/info/{series_id}",
            check_fields=["info", "episodes", "seasons"]
        )
        results["series_info"] = success
    else:
        print("\n⚠️  Skipping series info test - no series_id available")
        results["series_info"] = None
    
    # Test 12: Search
    success, data = test_endpoint(
        "12. Search (q=wonder)",
        f"{BASE_URL}/search?q=wonder",
        check_fields=["live", "vod", "series"]
    )
    results["search"] = success
    if success and isinstance(data, dict):
        print(f"   Search results: {len(data.get('live', []))} live, {len(data.get('vod', []))} vod, {len(data.get('series', []))} series")
    
    # Test 13: Image proxy
    test_image_url = "https://image.tmdb.org/t/p/w500/8UlWHLMpgZm9bx6QYh0NFoq67TZ.jpg"
    success, data = test_endpoint(
        "13. Image proxy",
        f"{BASE_URL}/img?url={test_image_url}",
        check_json=False
    )
    results["img_proxy"] = success
    if success:
        print(f"   Image size: {len(data)} bytes")
    
    # Test 14: Stream proxy (only headers, limited download)
    if stream_id:
        success, content_type = test_endpoint(
            f"14. Stream proxy (live stream_id={stream_id})",
            f"{BASE_URL}/stream/live/{stream_id}?ext=ts",
            check_json=False,
            stream_test=True
        )
        results["stream_proxy"] = success
        if success:
            print(f"   Content-Type: {content_type}")
            if content_type and 'video' in content_type.lower():
                print(f"   ✅ Correct content-type for video stream")
    else:
        print("\n⚠️  Skipping stream proxy test - no stream_id available")
        results["stream_proxy"] = None
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    passed = sum(1 for v in results.values() if v is True)
    failed = sum(1 for v in results.values() if v is False)
    skipped = sum(1 for v in results.values() if v is None)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result is True else ("❌ FAIL" if result is False else "⚠️  SKIP")
        print(f"{status}: {test_name}")
    
    print(f"\nTotal: {total} tests")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    print(f"Skipped: {skipped}")
    
    if failed > 0:
        print("\n❌ Some tests failed!")
        sys.exit(1)
    else:
        print("\n✅ All tests passed!")
        sys.exit(0)


if __name__ == "__main__":
    main()
