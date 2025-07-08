import React, { useState, useEffect } from "react";
import CostCalculator from "./pages/CostCalculator.jsx";
import Budget from "./pages/Budget.jsx"
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import SignUp from "./pages/SignUp.jsx";
import NavBar from "./components/nav_bar/NavBar.jsx"
import Footer from "./components/Footer.jsx"
import { Outlet, RouterProvider, createBrowserRouter } from "react-router-dom";

const Layout = () => {
  return (
    <div id="app-container">
      <NavBar />
      <div className="main-content">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}

const router = createBrowserRouter([{
  path: '/',
  element: <Layout />,
  children: [
    { path: '/', element: <Home /> },
    { path: '/home', element: <Home /> },
    { path: '/split-costs', element: <CostCalculator /> },
    { path: '/budget', element: <Budget /> },
    { path: '/login', element: <Login /> },
    { path: '/sign-up', element: <SignUp /> }
  ]
}])

function App() {
  const [, setUser] = useState(null);

  // Check auth status on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include'
        });
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      }
    };
    checkAuth();
  }, []);

  return (
    <RouterProvider router={router} />
  )
}

export default App;
