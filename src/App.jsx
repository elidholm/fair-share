import React from "react";
import CostCalculator from "./pages/CostCalculator.jsx";
import Budget from "./pages/Budget.jsx"
import Footer from "./components/Footer.jsx"
import { Outlet, RouterProvider, createBrowserRouter } from "react-router-dom";

const Layout = () => {
  return (
    <div id="app-container">
      <Outlet />
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
