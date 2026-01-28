import React from 'react';

const PreviewPanel = ({ design }) => {
    if (!design || !design.body || !design.body.rows) return null;
  
    return (
      <div className="space-y-4 p-4 bg-gray-50 rounded-lg border max-h-[60vh] overflow-auto">
        <h4 className="font-bold text-gray-700 mb-2">
          Parsed Structure & Styling Review
        </h4>
        {design.body.rows.map((row, rIdx) => (
          <div
            key={rIdx}
            className="border-2 border-blue-200 bg-white rounded p-3 relative mb-4"
            style={{ backgroundColor: row.values.backgroundColor || "#fff" }}
          >
            <div className="absolute top-1 right-1 bg-blue-500 text-white text-[10px] px-1 rounded shadow-sm">
              Row {rIdx + 1}
            </div>
            {row.values.backgroundColor &&
              row.values.backgroundColor !== "transparent" && (
                <div className="flex items-center text-[10px] text-gray-500 mb-2 gap-1 bg-white/80 px-1 rounded inline-flex">
                  <div
                    className="w-2 h-2 rounded-full border border-gray-300"
                    style={{ backgroundColor: row.values.backgroundColor }}
                  />
                  BG: {row.values.backgroundColor}
                </div>
              )}
            <div className="flex gap-2">
              {row.columns.map((col, cIdx) => (
                <div
                  key={cIdx}
                  className="flex-1 border border-dashed border-gray-400 p-2 bg-gray-100 rounded"
                  style={{
                    flexBasis: col.values._width,
                    backgroundColor: col.values.backgroundColor || "transparent",
                    padding: `${col.values.paddingTop || "10px"} ${col.values.paddingRight || "10px"} ${col.values.paddingBottom || "10px"} ${col.values.paddingLeft || "10px"}`,
                  }}
                >
                  <div className="text-[10px] font-bold text-gray-500 mb-1 flex justify-between">
                    <span>
                      Col {cIdx + 1} ({col.values._width})
                    </span>
                  </div>
                  <div className="space-y-1">
                    {col.contents.map((cmp, cmpIdx) => (
                      <div
                        key={cmpIdx}
                        className="bg-white border text-[11px] p-2 rounded shadow-sm"
                      >
                        <div className="flex items-center justify-between mb-1 border-b border-gray-50 pb-1">
                          <span className="font-bold text-purple-600 uppercase text-[9px]">
                            {cmp.type}
                          </span>
                          <div className="flex gap-1">
                            {cmp.values.color && (
                              <div
                                className="w-3 h-3 rounded-full border border-gray-200"
                                style={{ backgroundColor: cmp.values.color }}
                                title={`Text color: ${cmp.values.color}`}
                              />
                            )}
                            {cmp.values.backgroundColor &&
                              cmp.values.backgroundColor !== "transparent" && (
                                <div
                                  className="w-3 h-3 rounded border border-gray-200"
                                  style={{
                                    backgroundColor: cmp.values.backgroundColor,
                                  }}
                                  title={`BG color: ${cmp.values.backgroundColor}`}
                                />
                              )}
                          </div>
                        </div>
  
                        {cmp.type === "text" && (
                          <div className="text-gray-600">
                            <div className="truncate font-medium mb-1">
                              {cmp.values.text
                                .replace(/<[^>]*>/g, "")
                                .trim()
                                .substring(0, 40) || "(empty text)"}
                            </div>
                            <div className="grid grid-cols-2 gap-x-2 text-[9px] text-gray-400">
                              {cmp.values.fontSize && (
                                <span>Size: {cmp.values.fontSize}</span>
                              )}
                              {cmp.values.fontWeight && (
                                <span>Weight: {cmp.values.fontWeight}</span>
                              )}
                              {cmp.values.lineHeight && (
                                <span>L-Height: {cmp.values.lineHeight}</span>
                              )}
                              {cmp.values.fontFamily && (
                                <span className="truncate">
                                  Font: {cmp.values.fontFamily.label}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
  
                        {cmp.type === "image" && (
                          <div className="flex items-center justify-between text-blue-500 italic text-[10px]">
                            <span className="truncate max-w-[100px]">
                              {cmp.values.altText || "image"}
                            </span>
                            {cmp.values.width && (
                              <span className="text-gray-400 not-italic">
                                {cmp.values.width}
                              </span>
                            )}
                          </div>
                        )}
  
                        {cmp.type === "button" && (
                          <div className="flex flex-col gap-1">
                            <span className="text-green-600 font-bold truncate">
                              {cmp.values.text}
                            </span>
                            <div className="text-[9px] text-gray-400">
                              {cmp.values.buttonColors?.backgroundColor} |{" "}
                              {cmp.values.fontSize}
                            </div>
                          </div>
                        )}
  
                        <div className="mt-1 pt-1 border-t border-gray-50 text-[8px] text-gray-300 flex justify-between">
                          <span>
                            Pad: {cmp.values.paddingTop || "0"}/
                            {cmp.values.paddingRight || "0"}/
                            {cmp.values.paddingBottom || "0"}/
                            {cmp.values.paddingLeft || "0"}
                          </span>
                          {cmp.values.borderTop && <span>Has Border</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  export default PreviewPanel;
  