# EuroNano Translate — Hardware Specs

El rendimiento de la traducción NMT en dispositivo y la inferencia ASR (Whisper) dependen críticamente de los recursos del hardware móvil. A continuación se detallan las especificaciones objetivo y la experiencia esperada.

## 1. Dispositivos Gama Alta (Recomendado)
* **RAM**: 8 GB+
* **Chipset**: Snapdragon 8 Gen 1 / Gen 2 / Gen 3, Google Tensor G2 / G3, MediaTek Dimensity 9000+
* **Variante Modelo**: **Base** o **BaseMemory**
* **Rendimiento NMT**: ~6.0 tokens/segundo (traducción casi instantánea en textos cortos)
* **Rendimiento ASR**: Whisper Tiny se ejecuta en tiempo real (~0.5 RTF)
* **Tiempo total del pipeline (Conversación)**: ~1.5 - 2.0 segundos de latencia de voz a voz.

## 2. Dispositivos Gama Media
* **RAM**: 6 GB
* **Chipset**: Snapdragon 7s Gen 2, Snapdragon 778G, MediaTek Dimensity 7050
* **Variante Modelo**: **BaseMemory** o **Tiny**
* **Rendimiento NMT**: ~2.5 - 3.5 tokens/segundo
* **Rendimiento ASR**: Whisper Tiny se ejecuta razonablemente rápido (~0.8 - 1.2 RTF)
* **Tiempo total del pipeline (Conversación)**: ~3.0 - 4.5 segundos de latencia.

## 3. Dispositivos Gama Entrada (Mínimos)
* **RAM**: 4 GB (Límite crítico por uso de memoria de ASR + TTS + NMT simultáneos)
* **Chipset**: Snapdragon 680, MediaTek Helio G99
* **Variante Modelo**: Solo **Tiny**
* **Rendimiento NMT**: ~1.0 - 1.5 tokens/segundo
* **Gestión de RAM**: La aplicación está diseñada para descargar activamente los modelos de la memoria (función `unloadAllModels`) cuando el SO emite advertencias de memoria o pasa a segundo plano prolongado.

## Notas sobre Almacenamiento
* La app base (APK) ocupa ~80MB (incluyendo binarios nativos QVAC).
* La caché de modelos ocupará ~150 MB (si solo se usan 2 idiomas) hasta un máximo de ~400 MB si se descargan todas las variantes de los modelos NMT, Whisper Tiny (75MB) y Supertonic TTS.
