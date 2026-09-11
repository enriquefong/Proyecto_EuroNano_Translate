# EuroNano Translate

Una aplicación móvil Android de traducción de voz y texto 100% offline, desarrollada para el hackathon de QVAC. Basada en React Native, Expo, y el motor de IA local `@qvac/sdk`.

## Características

- **Traducción NMT (Bergamot)**: Traducción de alta calidad bidireccional entre Inglés y 9 idiomas europeos (DE, ES, FR, IT, PT, FI, CS, NL, SV) usando el modelo `TranslatePsy-EuroNano`.
- **Transcripción ASR (Whisper)**: Reconocimiento de voz local y privado.
- **Síntesis de Voz TTS (Supertonic)**: Reproducción de las traducciones generadas.
- **Enrutamiento Inteligente (Pivot Routing)**: Traducción automática entre pares sin inglés (ej. ES → FR) haciendo un pivote interno transparente (ES → EN → FR).
- **100% Local y Privado**: Tras la descarga inicial de los modelos, la app funciona completamente en modo avión.
- **3 Modos de Uso**:
  - 📝 **Modo Texto**: Traducción estilo chat con texto en tiempo real.
  - 🎤 **Modo Voz**: Push-to-talk para traducción por voz.
  - 💬 **Modo Conversación**: Pantalla dividida cara a cara para conversaciones fluidas.

## Requisitos del Sistema

- **Desarrollo**: Node.js >= v22.17, Expo CLI.
- **Dispositivo**: **Se requiere un teléfono Android físico**. El SDK de QVAC utiliza módulos nativos (JNI/C++) que no son compatibles con emuladores.
- **Android OS**: Mínimo SDK 29 (Android 10).
- **Hardware**: Se recomiendan 6GB+ RAM y CPU octa-core moderna (Snapdragon 7/8 gen, etc.) para latencia en tiempo real.

## Instalación y Ejecución

1. Instalar dependencias:
   ```bash
   npm install
   ```

2. Configurar el entorno nativo de Android (Prebuild):
   ```bash
   npx expo prebuild --platform android
   ```

3. Compilar e instalar en un dispositivo físico conectado (por USB o Wi-Fi Debugging):
   ```bash
   npx expo run:android --device
   ```

## Arquitectura

El núcleo de la aplicación está en `src/engine/TranslationEngineProvider.tsx`, que gestiona el ciclo de vida de los modelos usando un contexto de React y `Zustand` para el estado global. La lógica de ruteo de idiomas se encuentra en `src/engine/pivot-router.ts`.

## Privacidad

La privacidad es el pilar de este proyecto. No se envía telemetría, audio ni texto a ningún servidor externo. El 100% del procesamiento es *on-device*.
