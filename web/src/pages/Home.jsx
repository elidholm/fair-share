import React from "react";
import { DollarSign, PieChart } from "react-feather";
import { Card, LinkButton } from "../ui";
import "./Home.scss";

function Home() {
  return (
    <div className="home">
      <section className="home__hero">
        <h1>Welcome to Fair Share</h1>
        <p className="home__tagline">Simplifying shared finances for couples and roommates</p>
      </section>

      <div className="home__features">
        <Card as="section" className="home__feature" material="regular" padding="lg">
          <div className="home__feature-icon" aria-hidden="true">
            <DollarSign size={48} />
          </div>
          <h2>Split Costs</h2>
          <p>Easily divide expenses based on income or choose an equal split. Keep track of shared expenses and see who owes what.</p>
          <LinkButton to="/split-costs" variant="secondary">Split Expenses</LinkButton>
        </Card>

        <Card as="section" className="home__feature" material="regular" padding="lg">
          <div className="home__feature-icon" aria-hidden="true">
            <PieChart size={48} />
          </div>
          <h2>Budget Planning</h2>
          <p>Create and manage your monthly budget together. Set spending goals and track your progress.</p>
          <LinkButton to="/budget" variant="secondary">Plan Budget</LinkButton>
        </Card>
      </div>

      <section className="home__info">
        <h2>How It Works</h2>
        <ol className="home__steps">
          <li className="home__step">
            <span className="home__step-number" aria-hidden="true">1</span>
            <p>Enter individual incomes for fair expense distribution</p>
          </li>
          <li className="home__step">
            <span className="home__step-number" aria-hidden="true">2</span>
            <p>Add your shared expenses with descriptions and amounts</p>
          </li>
          <li className="home__step">
            <span className="home__step-number" aria-hidden="true">3</span>
            <p>Choose between proportional or equal splitting methods</p>
          </li>
          <li className="home__step">
            <span className="home__step-number" aria-hidden="true">4</span>
            <p>View the calculated shares for each person</p>
          </li>
        </ol>
      </section>

      <section className="home__cta">
        <h2>Ready to simplify your shared finances?</h2>
        <div className="home__cta-buttons">
          <LinkButton to="/split-costs" variant="primary" size="lg">Start Splitting Costs</LinkButton>
          <LinkButton to="/budget" variant="secondary" size="lg">Create a Budget</LinkButton>
        </div>
      </section>
    </div>
  );
}

export default Home;
