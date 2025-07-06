// src/theme/mypreset.ts
import { definePreset } from '@primeng/themes';
import Aura from '@primeng/themes/aura';

const MyPreset = definePreset(Aura, {
    semantic: {
        primary: {
            50: '{zinc.50}',
            100: '{zinc.100}',
            200: '{zinc.200}',
            300: '{zinc.300}',
            400: '{zinc.400}',
            500: '{zinc.500}',
            600: '{zinc.600}',
            700: '{zinc.700}',
            800: '{zinc.800}',
            900: '{zinc.900}',
            950: '{zinc.950}'
        },
        surface: {
            dark: {
                0: '{zinc.900}',     // Deep background (e.g., body)
                50: '{zinc.900}',    // Dark cards/containers
                100: '{zinc.800}',
                200: '{zinc.700}',
                300: '{zinc.600}',
                400: '{zinc.500}',
                500: '{zinc.400}',
                600: '{zinc.300}',
                700: '{zinc.200}',
                800: '{zinc.100}',
                900: '{zinc.50}'     // Lightest zinc used in dark cards
            }
        }
    },
    variables: {
    
        'surface-ground': '{surface.dark.0}',      // page background
        'surface-section': '{surface.dark.50}',    // layout sections
        'surface-card': '{surface.dark.100}',      // card background
        'surface-overlay': '{surface.dark.200}',   // dialogs, overlays        
        // 'surface-border': 'rgba(0,0,0,0.1)',     // default border color light mode
        'focus-ring': '{primary.500}',             // for accessibility outlines
    },
    colorScheme: {
            light: {
                primary: {
                    color: '{zinc.950}',
                    inverseColor: '#ffffff',
                    hoverColor: '{zinc.900}',
                    activeColor: '{zinc.800}'
                },
                highlight: {
                    background: '{zinc.950}',
                    focusBackground: '{zinc.700}',
                    color: '#ffffff',
                    focusColor: '#ffffff'
                }
            },
            dark: {
                primary: {
                    color: '{amber.100}',
                    inverseColor: '{amber.50}',
                    hoverColor: '{amber.50}',
                    activeColor: '{amber.100}'
                },
                highlight: {
                    background: 'rgba(250, 250, 250, .16)',
                    focusBackground: 'rgba(250, 250, 250, .24)',
                    color: 'rgba(255,255,255,.87)',
                    focusColor: '{zinc.500}'
                }
            }
        }
});

export default MyPreset;