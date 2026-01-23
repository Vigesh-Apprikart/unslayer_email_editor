import React, { useRef, useState, useCallback, useEffect } from "react";
import EmailEditor from "react-email-editor";
import { generateHtmlFromDesign, extractPlainText } from "../utils/emailUtils";
import { RotateCcw, RotateCw } from "lucide-react";

const getInitialState = () => {
  const savedDesign = localStorage.getItem("emailDesign");
  if (savedDesign) {
    try {
      const design = JSON.parse(savedDesign);
      // Check if the loaded design has the old red colors
      if (design.body && design.body.values) {
        const bodyBackgroundColor = design.body.values.backgroundColor;
        const bodyTextColor = design.body.values.textColor;

        // If either is red, assume the saved design is corrupted with the old default
        // and clear localStorage to force a reset to new defaults.
        if (
          bodyBackgroundColor === "#ff0000" ||
          bodyBackgroundColor === "red" ||
          bodyTextColor === "#ff0000"
        ) {
          console.warn(
            "Detected old red color in saved design. Clearing localStorage to reset defaults.",
          );
          localStorage.removeItem("emailDesign");
          // Do not proceed with loading this design, let the editor initialize with new defaults
          return {
            design: null,
            json: "",
            html: "",
            plainText: "",
          };
        }
      }

      const htmlContent = generateHtmlFromDesign(design);
      const plainTextContent = extractPlainText(htmlContent);
      return {
        design,
        json: JSON.stringify(design, null, 2),
        html: htmlContent,
        plainText: plainTextContent,
      };
    } catch (error) {
      console.error("Error parsing saved design:", error);
      // Also clear on parsing error to prevent issues if design is malformed
      localStorage.removeItem("emailDesign");
    }
  }
  return {
    design: null,
    json: "",
    html: "",
    plainText: "",
  };
};

const EmailEditorWithTabs = ({ onHtmlExport }) => {
  const [activeTab, setActiveTab] = useState("Design");
  const editorRef = useRef(null);
  const [emailData, setEmailData] = useState(getInitialState);
  const [savingStatus, setSavingStatus] = useState("idle"); // idle, saving, saved
  const [copyStatus, setCopyStatus] = useState("idle"); // idle, json, html, plainText
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  useEffect(() => {
    if (onHtmlExport && emailData.html) {
      onHtmlExport(emailData.html);
    }
  }, [emailData.html, onHtmlExport]);

  const updateUndoRedoState = useCallback(() => {
    if (editorRef.current?.editor) {
      editorRef.current.editor.canUndo((canUndo) => {
        setCanUndo(canUndo);
        editorRef.current.editor.canRedo((canRedo) => {
          setCanRedo(canRedo);
          console.log(
            "updateUndoRedoState - canUndo:",
            canUndo,
            "canRedo:",
            canRedo,
          );
        });
      });
    }
  }, []);

  const loadDesignFromStorage = useCallback(() => {
    if (!editorRef.current) return;

    const savedDesign = localStorage.getItem("emailDesign");
    if (savedDesign) {
      try {
        const design = JSON.parse(savedDesign);
        // Clear any existing content and load the design
        editorRef.current.editor.loadDesign(design);
        console.log("Design loaded from localStorage.");
        // Trigger a save to update the displayed JSON/HTML/Plain Text and reset saving status
        setSavingStatus("saving");
      } catch (error) {
        console.error("Error parsing saved design from localStorage:", error);
        alert(
          "Could not load design. The saved design might be corrupted. Clearing corrupted design from storage.",
        );
        localStorage.removeItem("emailDesign");
        editorRef.current.editor.loadDesign(null); // Load an empty design
        setSavingStatus("saving"); // Trigger a save to update the displayed JSON/HTML/Plain Text and reset saving status
      }
    } else {
      console.log(
        "No saved design found in localStorage. Loading empty design.",
      );
      editorRef.current.editor.loadDesign(null); // Load an empty design if nothing is saved
      alert("No saved design found in local storage. Editor has been cleared.");
      setSavingStatus("saving"); // Trigger a save to update the displayed JSON/HTML/Plain Text and reset saving status
    }
  }, []);

  const saveDesign = useCallback(() => {
    if (!editorRef.current) return;
    setSavingStatus("saving");

    editorRef.current.editor.exportHtml((data) => {
      const { design } = data;

      // --- Explicit Validation Step ---
      // Check if the design object is valid and not empty
      if (
        !design ||
        (typeof design === "object" &&
          Object.keys(design).length === 0 &&
          !design.body)
      ) {
        console.warn(
          "Attempted to save an empty or invalid design. Update aborted.",
        );
        setSavingStatus("idle"); // Reset status, as no valid save occurred
        // Optionally, add a user-facing notification here (e.g., a toast message)
        return;
      }
      // --- Debugging logs ---
      console.log("--- Unlayer Design Data (JSON) ---");
      console.log(JSON.stringify(design, null, 2));
      // --- End Debugging logs ---

      const jsonData = JSON.stringify(design, null, 2);

      // Generate our own bulletproof HTML from the design
      const customHtml = generateHtmlFromDesign(design);
      const plainTextContent = extractPlainText(customHtml);

      // --- Debugging logs ---
      console.log("--- Generated Custom HTML ---");
      console.log(customHtml);
      // --- End Debugging logs ---

      setEmailData({
        design,
        json: jsonData,
        html: customHtml, // Use our custom HTML
        plainText: plainTextContent,
      });

      // Save the design JSON to localStorage
      localStorage.setItem("emailDesign", JSON.stringify(design));

      setSavingStatus("saved");
      setTimeout(() => setSavingStatus("idle"), 2000);
      updateUndoRedoState();

      if (onHtmlExport) {
        onHtmlExport(customHtml); // Export generated HTML
      }
    });
  }, [onHtmlExport, updateUndoRedoState]); // Added onHtmlExport and updateUndoRedoState to dependency array

  useEffect(() => {
    const handler = setTimeout(() => {
      if (savingStatus === "saving") {
        saveDesign();
      }
    }, 1000);

    return () => {
      clearTimeout(handler);
    };
  }, [savingStatus, saveDesign]);

  const onEditorLoad = () => {
    // Load the saved design into the editor
    if (emailData.design) {
      editorRef.current.editor.loadDesign(emailData.design);
    } else {
      // If getInitialState found no valid design, load a fresh empty design
      editorRef.current.editor.loadDesign(null);
    }
    // Add event listener for auto-saving
    editorRef.current.editor.addEventListener("design:updated", () => {
      // Only set saving status if the active tab is 'Design' to avoid saving when viewing other tabs
      if (activeTab === "Design") {
        setSavingStatus("saving");
      }
    });
    editorRef.current.editor.addEventListener(
      "history:changed",
      updateUndoRedoState,
    );
    editorRef.current.editor.setBodyValues({ contentWidth: "700px" });
    console.log("Unlayer Editor instance:", editorRef.current.editor);
  };

  const handleUndo = () => {
    console.log("handleUndo called");
    if (editorRef.current) {
      editorRef.current.editor.undo();
    }
  };

  const handleRedo = () => {
    console.log("handleRedo called");
    if (editorRef.current) {
      editorRef.current.editor.redo();
    }
  };

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopyStatus(type);
      setTimeout(() => setCopyStatus("idle"), 2000);
    });
  };

  return (
    <div className="p-6 h-screen flex flex-col">
      {/* Tab Navigation */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setActiveTab("Design")}
            className={`${activeTab === "Design" ? "text-blue-500" : "text-gray-500"} font-semibold`}
          >
            Design
          </button>
          <button
            onClick={() => setActiveTab("JSON")}
            className={`${activeTab === "JSON" ? "text-blue-500" : "text-gray-500"}`}
          >
            JSON
          </button>
          <button
            onClick={() => setActiveTab("HTML")}
            className={`${activeTab === "HTML" ? "text-blue-500" : "text-gray-500"}`}
          >
            HTML
          </button>
          <button
            onClick={() => setActiveTab("Plain Text")}
            className={`${activeTab === "Plain Text" ? "text-blue-500" : "text-gray-500"}`}
          >
            Plain Text
          </button>
        </div>
        <div className="space-x-2 flex items-center">
          <button
            onClick={handleUndo}
            disabled={!canUndo || activeTab !== "Design"}
            className="p-2 w-10 h-10 text-white rounded bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 flex items-center justify-center"
            title="Undo"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo || activeTab !== "Design"}
            className="p-2 w-10 h-10 text-white rounded bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 flex items-center justify-center"
            title="Redo"
          >
            <RotateCw className="h-5 w-5" />
          </button>
          <button
            onClick={loadDesignFromStorage}
            disabled={activeTab !== "Design"}
            className="p-2 w-32 text-white rounded bg-green-500 hover:bg-green-600 disabled:bg-gray-400 flex items-center justify-center"
          >
            Load Design
          </button>
          <button
            onClick={saveDesign}
            disabled={savingStatus === "saving" || activeTab !== "Design"}
            className="p-2 w-32 text-white rounded bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 flex items-center justify-center"
          >
            {savingStatus === "saving" && (
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            )}
            {savingStatus === "idle" && "Save Design"}
            {savingStatus === "saving" && "Saving..."}
            {savingStatus === "saved" && "Saved!"}
          </button>
        </div>
      </div>

      <div className="flex-grow mt-4 overflow-hidden relative">
        <div style={{ display: activeTab === "Design" ? "block" : "none" }}>
          <EmailEditor
            ref={editorRef}
            onLoad={onEditorLoad}
            style={{ height: "calc(100vh - 120px)" }}
            options={{
              minHeight: 800, // Fixed pixel value
              // Device Management
              devices: ["desktop", "mobile"], // Enable both desktop and mobile
              defaultDevice: "desktop", // Default to desktop view
              appearance: {
                deviceSwitcher: true, // 👈 THIS IS REQUIRED
              },

              // Custom Fonts
              fonts: {
                showDefaultFonts: true, // Show Unlayer's default fonts
                customFonts: [
                  {
                    label: "Open Sans",
                    value: "'Open Sans', sans-serif",
                    url: "https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;700&display=swap",
                    weights: [
                      { label: "Normal", value: 400 },
                      { label: "Bold", value: 700 },
                    ],
                  },
                  {
                    label: "Comic Sans MS",
                    value: "'Comic Sans MS', cursive",
                  },
                  {
                    label: "Arial",
                    value: "Arial, sans-serif",
                  },
                ],
              },

              // Merge Tags
              mergeTags: {
                first_name: {
                  name: "First Name",
                  value: "{{first_name}}",
                  sample: "John",
                },
                last_name: {
                  name: "Last Name",
                  value: "{{last_name}}",
                  sample: "Doe",
                },
                shipping_address: {
                  name: "Shipping Address",
                  mergeTags: {
                    street_1: {
                      name: "Street 1",
                      value: "{{shipping_address.address_1}}",
                      sample: "123 Main St",
                    },
                    city: {
                      name: "City",
                      value: "{{shipping_address.city}}",
                      sample: "Anytown",
                    },
                  },
                },
              },

              editor: {
                autoSelectOnDrop: true,
              },
              features: {
                undoRedo: { enabled: true, autoSelect: true, autoFocus: true },
                preview: {
                  enabled: true,
                  deviceResolutions: {
                    showDefaultResolutions: true,
                    customResolutions: {
                      desktop: [
                        { value: 1000, name: "Medium Desktop" },
                        { value: 1440, name: "Large Desktop" },
                      ],
                      tablet: [
                        { value: 500, name: "Small Tablet" },
                        { value: 768, name: "iPad Portrait" },
                      ],
                      mobile: [
                        { value: 300, name: "Small Mobile" },
                        { value: 375, name: "iPhone X" },
                      ],
                    },
                  },
                },
              },
              tools: {
                html: {
                  // Configuration for the HTML tool
                  enabled: true, // Explicitly enable the HTML tool
                  properties: {
                    content: {
                      editor: {
                        safeHtml: true, // Enable HTML sanitization for security
                        // CodeMirror options for a clean editing experience
                        lineWrapping: true,
                        lineNumbers: true,
                        mode: "htmlmixed", // Enable syntax highlighting for HTML
                      },
                    },
                  },
                },
                bodies: {
                  properties: {
                    // Example: Text Input (widget: text) for a custom 'subject' property
                    subject: {
                      label: "Email Subject",
                      defaultValue: "New Email Design",
                      widget: "text",
                    },
                    // Example: Color Picker (widget: color_picker) for a custom 'borderColor'
                    borderColor: {
                      label: "Body Border Color",
                      defaultValue: "#CCCCCC",
                      widget: "color_picker",
                    },
                    // Example: Toggle (widget: toggle) for a custom 'enableShadow' property
                    enableShadow: {
                      label: "Enable Body Shadow",
                      defaultValue: false,
                      widget: "toggle",
                    },
                    // Example: Dropdown (widget: dropdown) for a custom 'theme' property
                    theme: {
                      label: "Email Theme",
                      defaultValue: "light",
                      widget: "dropdown",
                      data: [
                        { label: "Light", value: "light" },
                        { label: "Dark", value: "dark" },
                        { label: "Blue", value: "blue" },
                      ],
                    },
                    textColor: {
                      editor: {
                        defaultValue: "#000000",
                      },
                    },
                    backgroundColor: {
                      editor: {
                        defaultValue: "#FFFFFF",
                      },
                    },
                    fontFamily: {
                      editor: {
                        defaultValue: { value: "'Open Sans',sans-serif" },
                      },
                    },
                    contentAlign: {
                      editor: {
                        defaultValue: "center",
                      },
                    },
                    fontWeight: {
                      editor: {
                        defaultValue: 700,
                      },
                    },
                    preheaderText: {
                      editor: {
                        defaultValue: "Hello World",
                      },
                    },
                  },
                },
                rows: {
                  properties: {
                    // Example: Counter (widget: counter) for custom 'rowSpacing'
                    rowSpacing: {
                      label: "Row Spacing (px)",
                      defaultValue: 10,
                      widget: "counter",
                      data: {
                        min: 0,
                        max: 50,
                        step: 5,
                      },
                    },
                    noStackMobile: {
                      editor: {
                        _override: {
                          mobile: {
                            defaultValue: true, // Default value for 'Do Not Stack on Mobile'
                          },
                        },
                      },
                    },
                  },
                },
                button: {
                  properties: {
                    // Example: Link (widget: link) for custom 'buttonLink'
                    buttonLink: {
                      label: "Button URL",
                      defaultValue: {
                        url: "https://example.com",
                        target: "_blank",
                        // name: 'Custom Link' // name is read-only for existing links
                      },
                      widget: "link",
                    },
                    hideMobile: {
                      editor: {
                        _override: {
                          mobile: {
                            defaultValue: true, // Default value for 'Hide on Mobile' for Button tool
                          },
                        },
                      },
                    },
                  },
                },
              },
            }}
          />
        </div>
        <div
          style={{
            display: activeTab === "JSON" ? "block" : "none",
            height: "100%",
          }}
          className="relative"
        >
          <button
            onClick={() => handleCopy(emailData.json, "json")}
            className="absolute top-2 right-2 bg-gray-600 hover:bg-gray-700 text-white font-bold py-1 px-2 rounded"
          >
            {copyStatus === "json" ? "Copied!" : "Copy"}
          </button>
          <pre className="bg-gray-800 text-white p-4 overflow-auto h-full">
            {emailData.json || "No JSON data available"}
          </pre>
        </div>
        <div
          style={{
            display: activeTab === "HTML" ? "block" : "none",
            height: "100%",
          }}
          className="relative"
        >
          <button
            onClick={() => handleCopy(emailData.html, "html")}
            className="absolute top-2 right-2 bg-gray-600 hover:bg-gray-700 text-white font-bold py-1 px-2 rounded"
          >
            {copyStatus === "html" ? "Copied!" : "Copy"}
          </button>
          <pre className="bg-gray-800 text-white p-4 overflow-auto h-full">
            {emailData.html || "No HTML content available"}
          </pre>
        </div>
        <div
          style={{
            display: activeTab === "Plain Text" ? "block" : "none",
            height: "100%",
          }}
          className="relative"
        >
          <button
            onClick={() => handleCopy(emailData.plainText, "plainText")}
            className="absolute top-2 right-2 bg-gray-600 hover:bg-gray-700 text-white font-bold py-1 px-2 rounded"
          >
            {copyStatus === "plainText" ? "Copied!" : "Copy"}
          </button>
          <pre className="bg-gray-800 text-white p-4 overflow-auto h-full">
            {emailData.plainText || "No plain text content available"}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default EmailEditorWithTabs;
