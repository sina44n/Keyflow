/**
 * KEYFLOW Clerk Email Verification Template Verification Tests
 * =============================================================
 * Verifies that the redesigned Clerk verification email templates:
 * 1. Match the visual and architectural requirements of Reference Image 2.
 * 2. Contain all necessary Clerk Handlebars variables ({{{action_url}}}, {{code}}).
 * 3. Enforce email client compatibility (inline styles, tables, MSO tags, no scripts).
 * 4. Contain required copy: heading, description, button, fallback link, expiry, and security notices.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../..');

describe('KEYFLOW — Masterpiece Clerk Email Verification Redesign Tests', () => {
  const linkTemplatePath = path.resolve(rootDir, 'templates/emails/clerk_verification_link.html');
  const codeTemplatePath = path.resolve(rootDir, 'templates/emails/clerk_verification_code.html');

  it('clerk_verification_link.html exists and is well-formed HTML', () => {
    assert.ok(fs.existsSync(linkTemplatePath), 'Template file must exist');
    const content = fs.readFileSync(linkTemplatePath, 'utf-8');
    assert.ok(content.length > 500, 'Template file must not be empty');
    assert.ok(content.includes('<!DOCTYPE html>'), 'Must start with DOCTYPE declaration');
    assert.ok(content.includes('</html>'), 'Must contain closing html tag');
  });

  it('clerk_verification_link.html contains required KEYFLOW branding and logo', () => {
    const content = fs.readFileSync(linkTemplatePath, 'utf-8');
    assert.ok(content.includes('KEYFLOW'), 'Must include KEYFLOW brand name');
    assert.ok(content.includes('KF'), 'Must include KF badge mark');
    assert.ok(content.includes('#8B263E'), 'Must use KEYFLOW signature brand red/burgundy color');
  });

  it('clerk_verification_link.html contains exact required copy from Reference Image 2 specification', () => {
    const content = fs.readFileSync(linkTemplatePath, 'utf-8');

    // Heading
    assert.ok(content.includes('Verify your email address'), 'Must have "Verify your email address" heading');

    // Description
    assert.ok(
      content.includes('Welcome to KEYFLOW! Please confirm that this is your email address to activate your account and start your typing journey.'),
      'Must contain exact welcome description'
    );

    // Button
    assert.ok(content.includes('Verify my email'), 'Must contain "Verify my email" button text');

    // Fallback Link
    assert.ok(
      content.includes('Or copy and paste this link into your browser:'),
      'Must contain fallback copy-paste section'
    );

    // Expiry Notice
    assert.ok(
      content.includes('This verification link expires in 10 minutes.'),
      'Must contain 10-minute expiration notice'
    );

    // Security Notice
    assert.ok(
      content.includes("If you didn't create a KEYFLOW account, you can safely ignore this email."),
      'Must contain security notice'
    );

    // Footer
    assert.ok(
      content.includes('2026 KEYFLOW. All rights reserved.'),
      'Must contain 2026 copyright notice'
    );
  });

  it('clerk_verification_link.html binds the valid Clerk action_url variable to button and fallback', () => {
    const content = fs.readFileSync(linkTemplatePath, 'utf-8');
    // Using triple braces {{{action_url}}} to prevent HTML escaping of query parameters
    assert.ok(content.includes('{{{action_url}}}'), 'Must use {{{action_url}}} for raw unescaped URL');

    // Both button and fallback must reference {{{action_url}}}
    const occurrences = (content.match(/{{{action_url}}}/g) || []).length;
    assert.ok(occurrences >= 2, 'Must bind action_url in both primary CTA and fallback link');
  });

  it('clerk_verification_link.html strictly follows cross-client email compatibility standards', () => {
    const content = fs.readFileSync(linkTemplatePath, 'utf-8');

    // Must NOT contain JavaScript or script tags
    assert.ok(!content.includes('<script'), 'Email templates must NEVER contain <script> tags');

    // Must use table role="presentation" for accessibility & layout
    assert.ok(content.includes('role="presentation"'), 'Must use presentation tables');

    // Must include MSO VML fallback for Microsoft Outlook desktop
    assert.ok(content.includes('<!--[if mso]>'), 'Must include MSO conditionals for Outlook');
    assert.ok(content.includes('v:roundrect'), 'Must use VML roundrect for Outlook button styling');

    // Must use inline styles
    assert.ok(content.includes('style="'), 'Must use inline styling for email clients');
  });

  it('clerk_verification_code.html provides the valid OTP code template variant', () => {
    assert.ok(fs.existsSync(codeTemplatePath), 'OTP code template file must exist');
    const content = fs.readFileSync(codeTemplatePath, 'utf-8');

    assert.ok(content.includes('{{code}}'), 'Must include Clerk {{code}} variable');
    assert.ok(content.includes('Verify your email address'), 'Must have heading');
    assert.ok(content.includes('This verification code expires in 10 minutes.'), 'Must have expiry notice');
  });
});

