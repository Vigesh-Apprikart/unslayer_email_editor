import React from 'react';
import EmailEditor from 'react-email-editor';

const UnlayerEditor = ({ editorRef, onEditorLoad }) => {
  const options = {
    minHeight: 800,
    appearance: { deviceSwitcher: false },
    devices: ['desktop', 'mobile'],
    defaultDevice: 'desktop',

    fonts: {
      showDefaultFonts: true,
      customFonts: [
        {
          label: 'Open Sans',
          value: "'Open Sans', sans-serif",
          url: 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;700&display=swap',
          weights: [
            { label: 'Normal', value: 400 },
            { label: 'Bold', value: 700 },
          ],
        },
        { label: 'Comic Sans MS', value: "'Comic Sans MS', cursive" },
        { label: 'Arial', value: 'Arial, sans-serif' },
      ],
    },

    mergeTags: {
      first_name: {
        name: 'First Name',
        value: '{{first_name}}',
        sample: 'John',
      },
      last_name: {
        name: 'Last Name',
        value: '{{last_name}}',
        sample: 'Doe',
      },
      shipping_address: {
        name: 'Shipping Address',
        mergeTags: {
          street_1: {
            name: 'Street 1',
            value: '{{shipping_address.address_1}}',
            sample: '123 Main St',
          },
          city: {
            name: 'City',
            value: '{{shipping_address.city}}',
            sample: 'Anytown',
          },
        },
      },
    },

    editor: { autoSelectOnDrop: true },

    features: {
      undoRedo: { enabled: true, autoSelect: true, autoFocus: true },
      preview: {
        enabled: true,
        deviceResolutions: {
          showDefaultResolutions: true,
          customResolutions: {
            desktop: [
              { value: 1000, name: 'Medium Desktop' },
              { value: 1440, name: 'Large Desktop' },
            ],
            tablet: [
              { value: 500, name: 'Small Tablet' },
              { value: 768, name: 'iPad Portrait' },
            ],
            mobile: [
              { value: 300, name: 'Small Mobile' },
              { value: 375, name: 'iPhone X' },
            ],
          },
        },
      },
    },

    tools: {
      html: {
        enabled: true,
        properties: {
          content: {
            editor: {
              safeHtml: true,
              lineWrapping: true,
              lineNumbers: true,
              mode: 'htmlmixed',
            },
          },
        },
      },
      bodies: {
        properties: {
          subject: {
            label: 'Email Subject',
            defaultValue: 'New Email Design',
            widget: 'text',
          },
          borderColor: {
            label: 'Body Border Color',
            defaultValue: '#CCCCCC',
            widget: 'color_picker',
          },
          enableShadow: {
            label: 'Enable Body Shadow',
            defaultValue: false,
            widget: 'toggle',
          },
          theme: {
            label: 'Email Theme',
            defaultValue: 'dark',
            widget: 'dropdown',
            data: [
              { label: 'Light', value: 'light' },
              { label: 'Dark', value: 'dark' },
              { label: 'Blue', value: 'blue' },
            ],
          },
          textColor: { editor: { defaultValue: '#000000' } },
          backgroundColor: { editor: { defaultValue: '#FFFFFF' } },
          fontFamily: {
            editor: {
              defaultValue: { value: "'Open Sans',sans-serif" },
            },
          },
          contentAlign: { editor: { defaultValue: 'center' } },
          fontWeight: { editor: { defaultValue: 700 } },
          preheaderText: { editor: { defaultValue: 'Hello World' } },
        },
      },
      rows: {
        properties: {
          rowSpacing: {
            label: 'Row Spacing (px)',
            defaultValue: 10,
            widget: 'counter',
            data: { min: 0, max: 50, step: 5 },
          },
          noStackMobile: {
            editor: {
              _override: { mobile: { defaultValue: false } },
            },
          },
        },
      },
      button: {
        properties: {
          buttonLink: {
            label: 'Button URL',
            defaultValue: {
              url: 'https://example.com',
              target: '_blank',
            },
            widget: 'link',
          },
          hideMobile: {
            editor: {
              _override: { mobile: { defaultValue: false } },
            },
          },
        },
      },
      text: {
        properties: {
          hideMobile: {
            editor: {
              _override: { mobile: { defaultValue: false } },
            },
          },
        },
      },
      image: {
        properties: {
          hideMobile: {
            editor: {
              _override: { mobile: { defaultValue: false } },
            },
          },
        },
      },
    },
  };

  return (
    <EmailEditor
      ref={editorRef}
      onLoad={onEditorLoad}
      style={{ height: 'calc(100vh - 120px)' }}
      options={options}
    />
  );
};

export default UnlayerEditor;
