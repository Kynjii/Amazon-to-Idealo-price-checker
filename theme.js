const colors = {
    primary: "#ff9900",
    secondary: "#007bff",
    success: "#28a745",
    warning: "#ffc107",
    danger: "#dc3545",
    info: "#17a2b8",
    light: "#f8f9fa",
    dark: "#343a40",
    white: "#fff",
    black: "#000",
    gray: {
        100: "#f8f9fa",
        200: "#e9ecef",
        300: "#dee2e6",
        400: "#ced4da",
        500: "#adb5bd",
        600: "#6c757d",
        700: "#495057",
        800: "#343a40",
        900: "#212529"
    }
};

const similarityColors = {
    excellent: "#28a745",
    good: "#FFCC80",
    fair: "#E0E0E0",
    poor: "#dc3545"
};

const priceColors = {
    cheaper: "#A5D6A7",
    expensive: "#EF9A9A",
    neutral: "#6c757d"
};

const percentageColors = {
    increase: "#dc3545",
    blue: "#007bff",
    yellow: "#ffc107",
    green: "#28a745"
};

const buttonStyles = {
    primary: {
        background: colors.primary,
        color: colors.white,
        border: `1px solid ${colors.white}`,
        hoverBackground: "#e0a800"
    },
    secondary: {
        background: colors.secondary,
        color: colors.white,
        border: `1px solid ${colors.secondary}`,
        hoverBackground: "#0056b3"
    },
    success: {
        background: colors.success,
        color: colors.white,
        border: `1px solid ${colors.success}`,
        hoverBackground: "#218838"
    },
    warning: {
        background: colors.warning,
        color: colors.white,
        border: `1px solid ${colors.warning}`,
        hoverBackground: "#e0a800"
    }
};

const filterIcon = {
    position: "fixed",
    top: "16px",
    right: "16px",
    zIndex: "1001",
    background: colors.primary,
    border: `1px solid ${colors.white}`,
    borderRadius: "50%",
    width: "38px",
    height: "38px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
    cursor: "pointer",
    padding: "0"
};

const filterContainer = {
    position: "fixed",
    top: "60px",
    right: "16px",
    zIndex: "1000",
    background: colors.primary,
    border: `1px solid ${colors.white}`,
    borderRadius: "8px",
    padding: "16px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    fontSize: "14px",
    color: colors.gray[800],
    width: "280px",
    maxHeight: "400px",
    display: "none",
    flexDirection: "column",
    opacity: "0",
    transform: "translateY(-10px)",
    transition: "opacity 0.3s ease, transform 0.3s ease"
};

const idealoButton = {
    base: {
        display: "inline-block",
        margin: "8px 2px",
        padding: "8px 12px",
        backgroundColor: "#FFD180",
        color: "#4F4F4F",
        textDecoration: "none",
        borderRadius: "5px",
        fontWeight: "bold",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        transition: "all 0.3s ease",
        position: "relative",
        marginTop: "10px"
    },
    hover: {
        backgroundColor: "#FF8C00",
        color: colors.black,
        transform: "scale(1.05)"
    }
};

const navButton = {
    base: {
        width: "100%",
        padding: "10px",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        fontWeight: "bold",
        fontSize: "14px",
        marginBottom: "5px",
        transition: "all 0.3s ease",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
    }
};

const modalForm = {
    position: "fixed",
    top: "50%",
    transform: "translateY(-50%)",
    width: "25vw",
    minWidth: "300px",
    maxWidth: "400px",
    background: colors.white,
    border: `1px solid ${colors.gray[400]}`,
    borderRadius: "8px",
    padding: "20px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    zIndex: "10001",
    fontFamily: "Arial, sans-serif",
    fontSize: "14px",
    display: "flex",
    flexDirection: "column"
};

/**
 * Generates CSS style string from style object
 * @param {Object} styleObj - Style object with camelCase properties
 * @returns {string} - CSS style string
 */
function createStyleString(styleObj) {
    return Object.entries(styleObj)
        .map(([key, value]) => {
            const cssKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
            return `${cssKey}: ${value}`;
        })
        .join("; ");
}

const THEME = {
    colors,
    similarityColors,
    priceColors,
    percentageColors,
    buttonStyles,
    filterIcon,
    filterContainer,
    idealoButton,
    navButton,
    modalForm,
    createStyleString
};
