import fs from 'fs';

let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add adminUserId to ProfileView props
code = code.replace(
  `const ProfileView = ({
  isDarkMode,
  setIsDarkMode,
  profile,
  setProfile,
}: {
  isDarkMode: boolean;
  setIsDarkMode: (v: boolean) => void;
  profile: any;
  setProfile: (p: any) => void;
}) => {`,
  `const ProfileView = ({
  isDarkMode,
  setIsDarkMode,
  profile,
  setProfile,
  adminUserId,
}: {
  isDarkMode: boolean;
  setIsDarkMode: (v: boolean) => void;
  profile: any;
  setProfile: (p: any) => void;
  adminUserId?: string | null;
}) => {`
);

// 2. Pass adminUserId to ProfileView in App.tsx
// Let's use a regex to ensure we match it if it was slightly modified
code = code.replace(
  /<ProfileView\s+isDarkMode={isDarkMode}\s+setIsDarkMode={setIsDarkMode}\s+profile={profile}\s+setProfile={setProfile}\s*\/>/,
  `<ProfileView
                isDarkMode={isDarkMode}
                setIsDarkMode={setIsDarkMode}
                profile={activeProfile}
                setProfile={adminUserId ? setAdminUserProfile : setProfile}
                adminUserId={adminUserId}
              />`
);

// We need to also be careful that fetch/profile?admin_user_id uses the correct prop.
// Previously I replaced fetch('/api/profile...'), let's make sure that's fine.

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed ProfileView props');
