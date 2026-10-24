// Client-side authentication utility for GitHub Pages and static deployments
export function verifyCredentialsClientSide(rawUsername: any, rawPassword: any): boolean {
  if (!rawPassword && !rawUsername) return false;

  const user = String(rawUsername || '').trim().replace(/\s+/g, '').toLowerCase();
  const pass = String(rawPassword || '').trim().replace(/^["'“”‘’]+|["'“”‘’]+$/g, '').trim();
  const passLower = pass.toLowerCase();
  const passCompact = passLower.replace(/[\s\-_]/g, '');

  // 1. If username is Lucas / Lucas Hendsbee / Admin, grant instant access with any non-empty password
  const isLucasUser = 
    user.includes('lucas') || 
    user.includes('hendsbee') || 
    user.includes('admin') || 
    user.includes('whatthegoy') ||
    user === 'root';

  if (isLucasUser && pass.length > 0) {
    return true;
  }

  // 2. Secret passwords that grant instant access regardless of username
  const validPasswords = [
    'passwordforadmin',
    'password_for_admin',
    'password-for-admin',
    'hendsbee2011?',
    'hendsbee2011',
    'hendsbee2011!',
    'hendsbee_2011',
    'hendsbee 2011',
    'hendsbee 2011?',
    'drrtuiodrtduiivfgjxnflgk',
    'wtg_master_lucas_hendsbee_2026',
    'playgamesskib',
    'password',
    'admin',
  ];

  if (
    validPasswords.includes(pass) ||
    validPasswords.includes(passLower) ||
    validPasswords.includes(passCompact) ||
    passLower.startsWith('hendsbee2011') ||
    passLower.startsWith('passwordforadmin')
  ) {
    return true;
  }

  return false;
}
