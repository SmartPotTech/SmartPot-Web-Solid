// Las mismas preguntas se publican como datos estructurados (FAQPage) en index.html.
export const FAQ = [
    {
        question: "¿Qué es SmartPot?",
        answer: "Es una plataforma abierta para monitorear y automatizar cultivos hidropónicos: en maceta, tubos NFT, torre vertical o balsa flotante. Un ESP32 envía sus lecturas por MQTT, o SmartPot las simula en un cultivo virtual, y la aplicación las muestra en vivo, las analiza con inteligencia artificial y controla la bomba, la luz, el ventilador, el humidificador y los dosificadores.",
    },
    {
        question: "¿Necesito hardware?",
        answer: "No. Puedes crear un cultivo virtual que SmartPot simula por ti, o uno real con el mismo firmware simulado en Wokwi o grabado en una placa ESP32 con sensores. Al crearlo eliges real o virtual, y eso no cambia después.",
    },
    {
        question: "¿Qué cultivos soporta?",
        answer: "Lechuga, tomate, fresa, albahaca, espinaca y pimentón, cada uno con sus rangos ideales de temperatura, humedad, luz, pH, nutrientes y humedad del sustrato.",
    },
    {
        question: "¿Cómo decide el asistente de IA?",
        answer: "Combina un sistema experto con reglas de agronomía, lógica difusa para calcular un índice de salud, modelos de aprendizaje automático y un agente reactivo. Cada recomendación muestra las reglas y la certeza que la respaldan.",
    },
    {
        question: "¿Es seguro conectar mi dispositivo?",
        answer: "Sí. La conexión va cifrada con TLS, cada cultivo tiene su propia clave de dispositivo y el servidor solo le permite publicar y recibir mensajes de su propio cultivo.",
    },
    {
        question: "¿Cuánto cuesta?",
        answer: "SmartPot es gratuito y de código abierto bajo licencia MIT. Puedes usarlo en smartpot.app o desplegarlo en tu propio servidor.",
    },
];
