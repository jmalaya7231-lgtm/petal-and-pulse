import { Component } from "react";

export default class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error("Petal & Pulse error:", error);
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <div className="page">
        <div className="card card-soft stack" style={{ maxWidth: 520 }}>
          <h2 style={{ margin: 0 }}>Something went wrong</h2>
          <p className="muted" style={{ margin: 0 }}>
            Sorry about that. This didn't delete your saved study data. Try reloading the page.
          </p>
          <div>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>
              Reload page
            </button>
          </div>
        </div>
      </div>
    );
  }
}