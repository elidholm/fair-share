import React from "react";
import CostCalculator from "./pages/CostCalculator.jsx";
import Budget from "./pages/Budget.jsx"
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
    {
      path: '/',
      element: <CostCalculator />,
    },
    {
      path: '/home',
      element: <CostCalculator />,
    },
    {
      path: '/split-costs',
      element: <CostCalculator />,
    },
    {
      path: '/budget',
      element: <Budget />,
    },
  ]
}])

function App() {
  return (
    <RouterProvider router={router} />
  )
}

export default App;
