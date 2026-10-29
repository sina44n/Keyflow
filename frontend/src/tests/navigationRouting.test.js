import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('KEYFLOW Navigation & Core Routing Integrity', () => {
  it('App.jsx requires authentication for workstation, practice, academy, and arcade routes via ProtectedRoute', () => {
    const appPath = path.resolve(__dirname, '../App.jsx');
    const appContent = fs.readFileSync(appPath, 'utf-8');

    // Confirm core learning routes are properly wrapped in ProtectedRoute
    assert.ok(
      appContent.includes('<Route\n                      path="/workstation"\n                      element={\n                        <ProtectedRoute>'),
      'Workstation route must be protected by ProtectedRoute'
    );
    assert.ok(
      appContent.includes('<Route\n                      path="/practice"\n                      element={\n                        <ProtectedRoute>'),
      'Practice route must be protected by ProtectedRoute'
    );
    assert.ok(
      appContent.includes('<Route\n                      path="/academy"\n                      element={\n                        <ProtectedRoute>'),
      'Academy route must be protected by ProtectedRoute'
    );
    assert.ok(
      appContent.includes('<Route\n                      path="/arcade"\n                      element={\n                        <ProtectedRoute>'),
      'Arcade route must be protected by ProtectedRoute'
    );
  });

  it('Navbar contains accessible navigation links for workstation, academy, and arcade', () => {
    const navbarPath = path.resolve(__dirname, '../components/common/Navbar.jsx');
    const navbarContent = fs.readFileSync(navbarPath, 'utf-8');

    assert.ok(navbarContent.includes("href: '/workstation'"), 'Navbar must have workstation link');
    assert.ok(navbarContent.includes("href: '/academy'"), 'Navbar must have academy link');
    assert.ok(navbarContent.includes("href: '/arcade'"), 'Navbar must have arcade link');
    assert.ok(navbarContent.includes('primary: true'), 'Core links must have primary priority in Navbar');
  });
});
