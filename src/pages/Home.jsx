import React from "react";
import { Link } from "react-router-dom";
import { DollarSign, PieChart } from "react-feather";

function Home() {
  return (
    <div className="home-container">
      <div className="hero-section">
        <h1>Welcome to Fair Share</h1>
        <p className="tagline">Simplifying shared finances for couples and roommates</p>
      </div>

      <div className="features-section">
        <div className="feature-card">
          <div className="feature-icon">
            <DollarSign size={48} />
          </div>
          <h2>Split Costs</h2>
          <p>Easily divide expenses based on income or choose an equal split. Keep track of shared expenses and see who owes what.</p>
          <Link to="/split-costs" className="feature-button">Split Expenses</Link>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <PieChart size={48} />
          </div>
          <h2>Budget Planning</h2>
          <p>Create and manage your monthly budget together. Set spending goals and track your progress.</p>
          <Link to="/budget" className="feature-button">Plan Budget</Link>
        </div>
      </div>

      <div className="info-section">
        <h2>How It Works</h2>
        <div className="steps">
          <div className="step">
            <span className="step-number">1</span>
            <p>Enter individual incomes for fair expense distribution</p>
          </div>
          <div className="step">
            <span className="step-number">2</span>
            <p>Add your shared expenses with descriptions and amounts</p>
          </div>
          <div className="step">
            <span className="step-number">3</span>
            <p>Choose between proportional or equal splitting methods</p>
          </div>
          <div className="step">
            <span className="step-number">4</span>
            <p>View the calculated shares for each person</p>
          </div>
        </div>
      </div>

      <div className="cta-section">
        <h2>Ready to simplify your shared finances?</h2>
        <div className="cta-buttons">
          <Link to="/split-costs" className="primary-button">Start Splitting Costs</Link>
          <Link to="/budget" className="secondary-button">Create a Budget</Link>
        </div>
      </div>
    </div>
  );
}

export default Home;
