import fs from 'fs';

let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  `const AdminPanel = ({ profile }: { profile: any }) => {`,
  `const AdminPanel = ({ profile, setAdminUserId, setAdminUserName }: { profile: any, setAdminUserId: (id: string | null) => void, setAdminUserName: (name: string | null) => void }) => {`
);

code = code.replace(
  `<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">`,
  `<div className="flex gap-4 mb-6">
            <button
               onClick={() => {
                 setAdminUserId(selectedUser.id);
                 setAdminUserName(selectedUser.name);
               }}
               className="px-5 py-2.5 bg-gradient-to-r from-rose-500 to-fuchsia-600 text-white font-bold rounded-xl hover:opacity-90 transition-opacity shadow-sm"
            >
               Gestionar perfil completo
            </button>
          </div>\n          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">`
);

code = code.replace(
  `export default function App() {`,
  `export default function App() {\n  const [adminUserId, setAdminUserId] = useState<string | null>(null);\n  const [adminUserName, setAdminUserName] = useState<string | null>(null);`
);

code = code.replace(
  `} = useDanceStore(dashboardMonth, !!profile);`,
  `} = useDanceStore(dashboardMonth, !!profile, adminUserId);`
);

code = code.replace(
  `<AdminPanel profile={profile} />`,
  `<AdminPanel profile={profile} setAdminUserId={setAdminUserId} setAdminUserName={setAdminUserName} />`
);

code = code.replace(
  `<main className="pt-32 lg:pt-28 pb-12 px-4 max-w-6xl mx-auto">`,
  `<main className="pt-32 lg:pt-28 pb-12 px-4 max-w-6xl mx-auto">\n        {adminUserId && (
          <div className="bg-rose-500 text-white rounded-2xl p-4 mb-6 flex justify-between items-center shadow-lg">
            <div>
              <span className="font-black text-lg">Modo de Gestión</span>
              <p className="text-sm opacity-90">Estás viendo y editando como: <strong>{adminUserName}</strong></p>
            </div>
            <button onClick={() => { setAdminUserId(null); setAdminUserName(null); }} className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl font-bold transition-colors">
              Salir
            </button>
          </div>
        )}`
);

fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx updated');
