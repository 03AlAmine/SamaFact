import React from "react";

const LoadingState = ({ 
  message = "Chargement...",
  size = "medium",
  backgroundColor = "#ecf0f173",
  textColor = "#2c3e50"
}) => {
  const getSizeStyles = () => {
    switch (size) {
      case "small":
        return {
          container: { padding: "20px", maxWidth: "300px", margin: "20px auto" },
          spinner: { fontSize: "24px", marginBottom: "8px" },
          text: { fontSize: "16px" }
        };
      case "large":
        return {
          container: { padding: "60px", maxWidth: "500px", margin: "60px auto" },
          spinner: { fontSize: "40px", marginBottom: "15px" },
          text: { fontSize: "20px" }
        };
      default: // medium
        return {
          container: { padding: "40px", maxWidth: "400px", margin: "40px auto", marginTop: "5%" },
          spinner: { fontSize: "30px", marginBottom: "10px" },
          text: { fontSize: "18px" }
        };
    }
  };

  const styles = getSizeStyles();

  return (
    <div
      style={{
        ...styles.container,
        textAlign: "center",
        color: textColor,
        fontWeight: "500",
        fontFamily: "Inter, sans-serif",
        backgroundColor: backgroundColor,
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
      }}
    >
      <div
        style={{
          ...styles.spinner,
          animation: "spin 1.5s linear infinite",
          display: "inline-block",
        }}
      >
        ⏳
      </div>
      <div style={styles.text}>{message}</div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default React.memo(LoadingState);