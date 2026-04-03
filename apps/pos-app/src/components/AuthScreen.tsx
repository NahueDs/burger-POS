import { styles } from "../styles";

type AuthScreenProps = {
  authError: string | null;
  isAuthenticating: boolean;
  pinInput: string;
  onChangePin: (value: string) => void;
  onLogin: () => void;
};

export function AuthScreen({ authError, isAuthenticating, pinInput, onChangePin, onLogin }: AuthScreenProps) {
  return (
    <main style={styles.authScreen}>
      <section style={styles.authCard}>
        <p style={styles.eyebrow}>Acceso POS</p>
        <h1 style={styles.title}>Ingresar a caja</h1>
        <p style={styles.copy}>Protege el panel del local con un PIN simple.</p>
        <label style={styles.label}>
          PIN
          <input
            type="password"
            value={pinInput}
            onChange={(event) => onChangePin(event.target.value)}
            style={styles.input}
            placeholder="1234"
          />
        </label>
        {authError ? <p style={styles.authError}>{authError}</p> : null}
        <button
          onClick={onLogin}
          disabled={!pinInput || isAuthenticating}
          style={{ ...styles.actionButton, ...(!pinInput || isAuthenticating ? styles.buttonDisabled : {}) }}
        >
          {isAuthenticating ? "Ingresando..." : "Ingresar"}
        </button>
      </section>
    </main>
  );
}
