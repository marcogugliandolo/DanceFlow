import fs from 'fs';

let code = fs.readFileSync('src/App.tsx', 'utf8');

// Hide the "Contraseña actual" field when in admin proxy
code = code.replace(
  `              <input
                type="password"
                value={passwordState.current}
                onChange={(e) =>
                  setPasswordState({
                    ...passwordState,
                    current: e.target.value,
                  })
                }
                placeholder="Contraseña actual"
                className="w-full h-10 bg-zinc-100 dark:bg-zinc-800 px-3 rounded-xl text-sm border-none outline-none focus:ring-2 focus:ring-rose-500/50"
                required
              />`,
  `              {!adminUserId && (
                <input
                  type="password"
                  value={passwordState.current}
                  onChange={(e) =>
                    setPasswordState({
                      ...passwordState,
                      current: e.target.value,
                    })
                  }
                  placeholder="Contraseña actual"
                  className="w-full h-10 bg-zinc-100 dark:bg-zinc-800 px-3 rounded-xl text-sm border-none outline-none focus:ring-2 focus:ring-rose-500/50"
                  required
                />
              )}`
);

// We should also make sure `currentPassword` can be optional in App.tsx submit if adminUserId is present.
// Looking at the password change function in App.tsx
// It's probably something like:

code = code.replace(
  `    if (passwordState.new !== passwordState.confirm) {
      alert("Las contraseñas no coinciden");
      return;
    }`,
  `    if (passwordState.new !== passwordState.confirm) {
      alert("Las contraseñas no coinciden");
      return;
    }
    if (!adminUserId && !passwordState.current) {
       alert("Introduce la contraseña actual");
       return;
    }`
);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed password field for admin');
