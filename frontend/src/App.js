import { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { supabase } from "./supabaseClient";

// Importando os componentes das pastas
import TallyScreen from "./components/TallyScreen";
import LoginScreen from "./components/LoginScreen";
import AdminDashboard from "./components/AdminDashboard";

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading)
    return (
      <div
        style={{
          backgroundColor: "#0f172a",
          height: "100vh",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        Carregando...
      </div>
    );

  return (
    <Router>
      <Routes>
        {/* Rota do Cinegrafista (Aberta) */}
        <Route path="/" element={<TallyScreen />} />

        {/* Rota do Admin (Protegida) */}
        <Route
          path="/admin"
          element={
            session ? <AdminDashboard user={session.user} /> : <LoginScreen />
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
