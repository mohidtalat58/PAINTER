import React, { useState, useEffect, useRef } from "react";

const Navbar = ({ onClearCanvas }) => {
  const [showHelp, setShowHelp] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null); // "file" | "edit" | "view" | null

  const helpRef = useRef(null);
  const navbarRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (helpRef.current && !helpRef.current.contains(event.target)) {
        setShowHelp(false);
      }
      if (navbarRef.current && !navbarRef.current.contains(event.target)) {
        setActiveMenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <div style={styles.navbar} ref={navbarRef}>
        {/* Left - Interactive Dropdown Menus */}
        <div style={styles.left}>
          <div style={styles.dropdownContainer}>
            <button 
              style={activeMenu === "file" ? styles.activeNavBtn : styles.navBtn} 
              onClick={() => setActiveMenu(activeMenu === "file" ? null : "file")}
            >
              File
            </button>
            {activeMenu === "file" && (
              <div style={styles.dropdown}>
                <div style={styles.dropdownItem} onClick={() => { onClearCanvas(); setActiveMenu(null); }}>New (Clear)</div>
                <div style={styles.dropdownItem} onClick={() => window.print()}>Print</div>
              </div>
            )}
          </div>

          <div style={styles.dropdownContainer}>
            <button 
              style={activeMenu === "edit" ? styles.activeNavBtn : styles.navBtn} 
              onClick={() => setActiveMenu(activeMenu === "edit" ? null : "edit")}
            >
              Edit
            </button>
            {activeMenu === "edit" && (
              <div style={styles.dropdown}>
                <div style={styles.dropdownItem} onClick={() => { onClearCanvas(); setActiveMenu(null); }}>Clear Canvas</div>
              </div>
            )}
          </div>

          <div style={styles.dropdownContainer}>
            <button 
              style={activeMenu === "view" ? styles.activeNavBtn : styles.navBtn} 
              onClick={() => setActiveMenu(activeMenu === "view" ? null : "view")}
            >
              View
            </button>
            {activeMenu === "view" && (
              <div style={styles.dropdown}>
                <div style={styles.dropdownItem} onClick={() => alert("Gridlines toggled (Visual Guide Only)")}>Gridlines</div>
                <div style={styles.dropdownItem} onClick={() => alert("Status Bar toggled")}>Status Bar</div>
              </div>
            )}
          </div>
        </div>

        {/* Center Logo */}
        <div style={styles.center}>
          <h1 style={styles.logo}>Painter</h1>
        </div>

        {/* Right Menu Buttons */}
        <div style={styles.right}>
          <button
            style={styles.btn}
            onClick={(e) => {
              e.stopPropagation(); 
              setShowHelp(!showHelp);
            }}
          >
            Help
          </button>
          <button style={styles.btn}>Profile</button>
        </div>
      </div>

      {/* Help Panel Pop-out */}
      {showHelp && (
        <div style={styles.helpBox} ref={helpRef}>
          <h2>About Painter</h2>
          <p>
            Painter is a simple and creative drawing application designed to help
            users express their ideas visually. The application allows users to
            create freehand drawings using a brush tool and design shapes such as
            rectangles and circles with ease.
          </p>
          <p>
            The purpose of Painter is to provide an easy-to-use environment where
            users can practice digital art, create diagrams, sketch ideas, and
            experiment with colors.
          </p>
          <button
            style={styles.closeBtn}
            onClick={() => setShowHelp(false)}
          >
            Close
          </button>
        </div>
      )}
    </>
  );
};

const styles = {
  navbar: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "60px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "#1e1e2f",
    color: "#fff",
    padding: "0 20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
    zIndex: 1000,
  },
  left: {
    display: "flex",
    gap: "10px",
  },
  dropdownContainer: {
    position: "relative",
  },
  navBtn: {
    padding: "6px ",
    borderRadius: "1px",
    background: "#201c1cfb",
    color: "white",
    cursor: "pointer",
  },
  activeNavBtn: {
    padding: "6px 12px",
    background: "#3b82f6",
    border: "none",
    color: "white",
    cursor: "pointer",
    borderRadius: "4px",
    fontSize: "14px",
  },
  dropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    background: "white",
    color: "black",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    borderRadius: "4px",
    padding: "4px 0",
    minWidth: "140px",
    zIndex: 1001,
  },
  dropdownItem: {
    padding: "8px 12px",
    cursor: "pointer",
    fontSize: "13px",
    backgroundColor: "transparent",
    transition: "background 0.2s"
  },
  center: {
    position: "absolute",
    left: "50%",
    transform: "translateX(-50%)",
  },
  right: {
    display: "flex",
    gap: "10px",
  },
  logo: {
    margin: 0,
    fontSize: "32px",
    fontWeight: "bold",
  },
  btn: {
    padding: "6px ",
    borderRadius: "1px",
    background: "#201c1cfb",
    color: "white",
    cursor: "pointer",
  },
  helpBox: {
    position: "fixed",
    top: "80px",
    right: "20px",
    width: "320px",
    maxHeight: "450px", 
    overflowY: "auto",
    background: "white",
    color: "black",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
    zIndex: 2000,
    border: "1px solid #ccc"
  },
  closeBtn: {
    marginTop: "10px",
    padding: "8px 12px",
    cursor: "pointer",
    width: "100%",
    background: "#ef4444",
    color: "white",
    border: "none",
    borderRadius: "4px",
    fontWeight: "bold"
  },
};

export default Navbar;