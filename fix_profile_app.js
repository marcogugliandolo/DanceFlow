import fs from 'fs';

let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  `const [adminUserName, setAdminUserName] = useState<string | null>(null);`,
  `const [adminUserName, setAdminUserName] = useState<string | null>(null);\n  const [adminUserProfile, setAdminUserProfile] = useState<any | null>(null);`
);

code = code.replace(
  `                 setAdminUserId(selectedUser.id);
                 setAdminUserName(selectedUser.name);`,
  `                 setAdminUserId(selectedUser.id);
                 setAdminUserName(selectedUser.name);
                 setAdminUserProfile({
                   name: selectedUser.name,
                   email: selectedUser.email,
                   avatarUrl: selectedUser.avatar_url,
                   role: selectedUser.role
                 });`
);

code = code.replace(
  `            <button onClick={() => { setAdminUserId(null); setAdminUserName(null); }} className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl font-bold transition-colors">`,
  `            <button onClick={() => { setAdminUserId(null); setAdminUserName(null); setAdminUserProfile(null); }} className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl font-bold transition-colors">`
);

code = code.replace(
  `} = useDanceStore(dashboardMonth, !!profile, adminUserId);`,
  `} = useDanceStore(dashboardMonth, !!profile, adminUserId);\n\n  const activeProfile = adminUserId && adminUserProfile ? adminUserProfile : profile;`
);

// We need to replace `profile.` with `activeProfile.` in all rendering logic EXCEPT for `profile.role === "admin"` conditionally used for showing admin panels.
// Wait, actually, let's just do it manually for rendering:

code = code.replace(
  `<strong className="text-zinc-900 dark:text-white">{profile.name || "Usuario"}</strong>`,
  `<strong className="text-zinc-900 dark:text-white">{activeProfile.name || "Usuario"}</strong>`
);

code = code.replace(
  `                   ) : profile.avatarUrl ? (
                      <img
                        src={profile.avatarUrl}`,
  `                   ) : activeProfile.avatarUrl ? (
                      <img
                        src={activeProfile.avatarUrl}`
);

code = code.replace(
  `                  ) : profile.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}`,
  `                  ) : activeProfile.avatarUrl ? (
                    <img
                      src={activeProfile.avatarUrl}`
);

// The Perfil component takes `profile` and `setProfile`.
code = code.replace(
  `<Perfil
                isDarkMode={isDarkMode}
                setIsDarkMode={setIsDarkMode}
                profile={profile}
                setProfile={setProfile}
              />`,
  `<Perfil
                isDarkMode={isDarkMode}
                setIsDarkMode={setIsDarkMode}
                profile={activeProfile}
                setProfile={adminUserId ? setAdminUserProfile : setProfile}
                adminUserId={adminUserId}
              />`
);

code = code.replace(
  `const Perfil = ({
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
  `const Perfil = ({
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

code = code.replace(
  `const res = await fetch('/api/profile', {`,
  `const res = await fetch(\`/api/profile\${adminUserId ? '?admin_user_id=' + adminUserId : ''}\`, {`
);

code = code.replace(
  `const res = await fetch("/api/change-password", {`,
  `const res = await fetch(\`/api/change-password\${adminUserId ? '?admin_user_id=' + adminUserId : ''}\`, {`
);

fs.writeFileSync('src/App.tsx', code);
console.log('Done App.tsx updates');
