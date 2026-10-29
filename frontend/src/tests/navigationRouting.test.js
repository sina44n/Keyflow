import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('KEYFLOW Navigation & Core Routing Integrity', () => {
  it('App.jsx exposes workstation, practice, academy, and arcade routes without forced ProtectedRoute redirect', () => {
    const appPath = path.resolve(__dirname, '../App.jsx');
    const appContent = fs.readFileSync(appPath, 'utf-8');

    // Confirm core learning routes are not wrapped in ProtectedRoute
    const workstationMatch = appContent.match(/path="\/workstation"\s+element=\{([^}]+)\}/);
    assert.ok(workstationMatch, 'Workstation route must exist in App.jsx');
    assert.ok(
      !workstationMatch[1].includes('ProtectedRoute'),
      'Workstation route must not be locked behind ProtectedRoute'
    );

    const arcadeMatch = appContent.match(/path="\/arcade"\s+element=\{([^}]+)\}/);
    assert.ok(arcadeMatch, 'Arcade route must exist in App.jsx');
    assert.ok(
      !arcadeMatch[1].includes('ProtectedRoute'),
      'Arcade route must not be locked behind ProtectedRoute'
    );

    const academyMatch = appContent.match(/path="\/academy"\s+element=\{([^}]+)\}/);
    assert.ok(academyMatch, 'Academy route must exist in App.jsx');
    assert.ok(
      !academyMatch[1].includes('ProtectedRoute'),
      'Academy route must not be locked behind ProtectedRoute'
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
