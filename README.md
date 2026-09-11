# EuroNano Translate

> Una aplicación móvil de traducción de voz y texto 100% offline. Utiliza inteligencia artificial ejecutada localmente en el teléfono para traducir texto en tiempo real, escuchar voz y reproducir audio, garantizando absoluta privacidad y funcionamiento sin internet.

[![Android Release](https://github.com/enriquefong/Proyecto_EuroNano_Translate/actions/workflows/release.yml/badge.svg?branch=main)](https://github.com/enriquefong/Proyecto_EuroNano_Translate/actions/workflows/release.yml)
[![Licencia MIT](https://img.shields.io/badge/licencia-MIT-2ea44f.svg)](LICENSE)

## Entrega del Proyecto

| Recurso | Enlace |
| --- | --- |
| Aplicación Android | **[Descargar APK (Última versión)](https://github.com/enriquefong/Proyecto_EuroNano_Translate/releases/latest)** |
| Historial de Versiones | [Página de Releases](https://github.com/enriquefong/Proyecto_EuroNano_Translate/releases) |
| Código Fuente | [Repositorio en GitHub](https://github.com/enriquefong/Proyecto_EuroNano_Translate) |

## La Propuesta

Las aplicaciones de traducción convencionales requieren una conexión activa a internet, lo cual es problemático al viajar al extranjero (costos de roaming, zonas sin cobertura) y plantea riesgos de privacidad al enviar tu voz y conversaciones a servidores de terceros.

EuroNano Translate resuelve esto procesando todo localmente:

1. **Traducción NMT (Bergamot)**: Traducción de alta calidad bidireccional entre Inglés y 9 idiomas europeos (DE, ES, FR, IT, PT, FI, CS, NL, SV) usando el modelo `TranslatePsy-EuroNano`. Todo corre en la memoria del celular.
2. **Reconocimiento y Síntesis de Voz (ASR/TTS)**: Reconocimiento de voz mediante *Whisper* y reproducción mediante *Supertonic* para tener conversaciones fluidas.
3. **Enrutamiento Inteligente (Pivot Routing)**: Traducción automática entre idiomas que no son inglés (ej. Español ↔ Francés) haciendo un salto interno transparente (ES → EN → FR) usando el inglés como pivote.
4. **Privacidad Absoluta**: Tras descargar los modelos de idioma necesarios bajo demanda (una sola vez), la aplicación opera 100% en modo avión. Nunca envía audio, texto ni telemetría a la nube.

## Modos de Uso

| Modo | Descripción |
| --- | --- |
| 💬 **Modo Texto** | Interfaz clásica de traducción. Escribe texto y obtén resultados instantáneos. |
| 🎙️ **Modo Voz** | Funcionalidad *Push-to-talk* (presionar para hablar). Transcribe tu voz y la traduce al idioma destino. |
| 🤝 **Modo Conversación** | Pantalla dividida diseñada para poner el teléfono entre dos personas y tener una conversación cara a cara. |

## Requisitos y Configuración Técnica

*   **Dispositivo**: Se requiere un teléfono Android físico (mínimo Android 10 / SDK 29). El procesamiento neuronal utiliza módulos nativos (JNI/C++) incompatibles con emuladores.
*   **Hardware Recomendado**: 6GB+ RAM y CPU octa-core moderna para traducciones fluidas en tiempo real.
*   **Desarrollo Local**: Si deseas compilar la app desde el código:
    ```bash
    npm install
    npx expo prebuild --platform android
    npx expo run:android --device
    ```

## Arquitectura del Sistema

El núcleo de la aplicación reside en `src/engine/TranslationEngineProvider.tsx`, encargado de orquestar el ciclo de vida de los modelos IA locales a través del SDK `@qvac/sdk`. 
La lógica de cálculo de rutas entre idiomas se encuentra en `src/engine/pivot-router.ts`, y todo el estado global se administra eficientemente usando `Zustand`.
