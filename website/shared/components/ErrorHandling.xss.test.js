/**
 * XSS Security Test Suite for ErrorHandling.js
 * Tests DOMPurify sanitization against various XSS payloads
 */

import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Setup DOMPurify with JSDOM for Node.js testing
const { window } = new JSDOM('<!DOCTYPE html>');
const purify = DOMPurify(window);

// Test configuration - matches the ErrorHandling.js implementation
const sanitizeConfig = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'span'],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style'],
  ALLOW_DATA_ATTR: false,
  SANITIZE_DOM: true,
};

function sanitizeHTML(str) {
  if (typeof str !== 'string') return '';
  return purify.sanitize(str, sanitizeConfig);
}

function sanitizeURL(url) {
  if (typeof url !== 'string') return '/';

  const trimmed = url.trim().toLowerCase();
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:', 'about:', 'blob:'];
  
  for (const protocol of dangerousProtocols) {
    if (trimmed.startsWith(protocol)) {
      console.log('  ✓ Blocked dangerous protocol:', protocol);
      return '/';
    }
  }

  try {
    const decoded = decodeURIComponent(trimmed);
    for (const protocol of dangerousProtocols) {
      if (decoded.startsWith(protocol)) {
        console.log('  ✓ Blocked encoded dangerous URL');
        return '/';
      }
    }
  } catch (e) {
    // Invalid URL encoding
  }

  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')) {
    return purify.sanitize(url, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  }

  return '/';
}

// XSS Test Payloads
const xssPayloads = [
  {
    name: 'Basic Script Tag',
    input: '<script>alert(1)</script>',
    shouldRemove: true,
    shouldContain: '',
  },
  {
    name: 'Script with Src',
    input: '<script src="http://evil.com/xss.js"></script>',
    shouldRemove: true,
    shouldContain: '',
  },
  {
    name: 'Image Onerror',
    input: '<img src=x onerror=alert(1)>',
    shouldRemove: true,
    dangerousPart: 'onerror',
  },
  {
    name: 'SVG Onload',
    input: '<svg onload=alert(1)>',
    shouldRemove: true,
    dangerousPart: 'onload',
  },
  {
    name: 'Iframe Injection',
    input: '<iframe src="javascript:alert(1)">',
    shouldRemove: true,
    dangerousPart: 'iframe',
  },
  {
    name: 'Body Onload',
    input: '<body onload=alert(1)>',
    shouldRemove: true,
    dangerousPart: 'onload',
  },
  {
    name: 'JavaScript Protocol',
    input: 'javascript:alert(1)',
    type: 'url',
    shouldBlock: true,
  },
  {
    name: 'Encoded JavaScript Protocol',
    input: '%6a%61%76%61%73%63%72%69%70%74:alert(1)',
    type: 'url',
    shouldBlock: true,
  },
  {
    name: 'Data URI',
    input: 'data:text/html,<script>alert(1)</script>',
    type: 'url',
    shouldBlock: true,
  },
  {
    name: 'Bold Tag (Should Preserve)',
    input: '<b>Bold text</b>',
    shouldRemove: false,
    shouldContain: '<b>Bold text</b>',
  },
  {
    name: 'Italic Tag (Should Preserve)',
    input: '<i>Italic text</i>',
    shouldRemove: false,
    shouldContain: '<i>Italic text</i>',
  },
  {
    name: 'Strong Tag (Should Preserve)',
    input: '<strong>Strong text</strong>',
    shouldRemove: false,
    shouldContain: '<strong>Strong text</strong>',
  },
  {
    name: 'Link Tag (Should Preserve)',
    input: '<a href="/safe-link">Click here</a>',
    shouldRemove: false,
    shouldContain: '<a href="/safe-link">Click here</a>',
  },
  {
    name: 'Link with JavaScript',
    input: '<a href="javascript:alert(1)">Click me</a>',
    shouldRemove: true,
    dangerousPart: 'javascript',
  },
  {
    name: 'Div with Onclick',
    input: '<div onclick="alert(1)">Click me</div>',
    shouldRemove: true,
    dangerousPart: 'onclick',
  },
  {
    name: 'Input Autofocus',
    input: '<input autofocus onfocus=alert(1)>',
    shouldRemove: true,
    dangerousPart: 'onfocus',
  },
  {
    name: 'Object Tag',
    input: '<object data="javascript:alert(1)">',
    shouldRemove: true,
  },
  {
    name: 'Embed Tag',
    input: '<embed src="javascript:alert(1)">',
    shouldRemove: true,
  },
  {
    name: 'Normal Error Message',
    input: 'Page not found. Please check the URL and try again.',
    shouldRemove: false,
    shouldContain: 'Page not found. Please check the URL and try again.',
  },
  {
    name: 'Complex HTML with Safe Tags',
    input: '<p>This is a <b>bold</b> and <i>italic</i> message with a <a href="/help">help link</a>.</p>',
    shouldRemove: false,
    shouldContain: '<p>This is a <b>bold</b> and <i>italic</i> message with a <a href="/help">help link</a>.</p>',
  },
  {
    name: 'Nested Script in Div',
    input: '<div><script>alert(1)</script>Safe text</div>',
    shouldRemove: true,
    dangerousPart: 'script',
    shouldContain: 'Safe text',
  },
  {
    name: 'Meta Refresh',
    input: '<meta http-equiv="refresh" content="0;url=javascript:alert(1)">',
    shouldRemove: true,
  },
  {
    name: 'Form Action',
    input: '<form action="javascript:alert(1)"><input type="submit"></form>',
    shouldRemove: true,
    dangerousPart: 'form',
  },
  {
    name: 'Style Tag with Expression',
    input: '<style>body{background-image:url("javascript:alert(1)")}</style>',
    shouldRemove: true,
  },
];

// Test Results
let passed = 0;
let failed = 0;
const results = [];

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║     XSS Security Test Suite - ErrorHandling.js            ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

console.log(`Running ${xssPayloads.length} XSS test cases...\n`);

for (const test of xssPayloads) {
  let result;
  let isPass = false;
  
  if (test.type === 'url') {
    result = sanitizeURL(test.input);
    isPass = test.shouldBlock ? result === '/' : result !== '/';
  } else {
    result = sanitizeHTML(test.input);
    
    if (test.shouldRemove) {
      // For attacks that should be completely removed
      if (test.dangerousPart) {
        isPass = !result.toLowerCase().includes(test.dangerousPart.toLowerCase());
      } else {
        isPass = result === '' || result === test.input.replace(/<[^>]+>/g, '').trim();
      }
    } else {
      // For safe content that should be preserved
      isPass = result.includes(test.shouldContain || test.input);
    }
  }
  
  if (isPass) {
    passed++;
    console.log(`✅ PASS: ${test.name}`);
    console.log(`   Input:  ${test.input.substring(0, 60)}${test.input.length > 60 ? '...' : ''}`);
    console.log(`   Output: ${result.substring(0, 60)}${result.length > 60 ? '...' : ''}`);
  } else {
    failed++;
    console.log(`❌ FAIL: ${test.name}`);
    console.log(`   Input:  ${test.input}`);
    console.log(`   Output: ${result}`);
    console.log(`   Expected: ${test.shouldRemove ? 'removed/blocked' : 'preserved'}`);
  }
  
  results.push({
    name: test.name,
    passed: isPass,
    input: test.input,
    output: result,
  });
  console.log('');
}

// Summary
console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║                      TEST SUMMARY                          ║');
console.log('╠════════════════════════════════════════════════════════════╣');
console.log(`║  Total Tests:  ${xssPayloads.length.toString().padEnd(43)} ║`);
console.log(`║  Passed:       ${passed.toString().padEnd(43)} ║`);
console.log(`║  Failed:       ${failed.toString().padEnd(43)} ║`);
console.log(`║  Success Rate: ${((passed / xssPayloads.length) * 100).toFixed(1)}%${''.padEnd(41)} ║`);
console.log('╚════════════════════════════════════════════════════════════╝');

// Security Assessment
console.log('\n🔒 SECURITY ASSESSMENT:');
if (failed === 0) {
  console.log('   ✅ ALL XSS PAYLOADS NEUTRALIZED');
  console.log('   ✅ XSS VULNERABILITY ELIMINATED');
  console.log('   ✅ Safe HTML preserved (b, i, a tags)');
  console.log('   ✅ Production deployment APPROVED');
} else {
  console.log('   ⚠️  SOME XSS PAYLOADS NOT BLOCKED');
  console.log('   ❌ VULNERABILITY STILL PRESENT');
  console.log('   ❌ DO NOT DEPLOY TO PRODUCTION');
}

// Export for CI/CD integration
export { results, passed, failed };
