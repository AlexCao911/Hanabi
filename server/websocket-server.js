const WebSocket = require('ws');
const http = require('http');

const PORT = 3000;

// 创建 HTTP 服务器
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('WebSocket Server Running\n');
});

// 创建 WebSocket 服务器
const wss = new WebSocket.Server({ 
  server,
  path: '/sensor'
});

// 存储所有连接的客户端
const clients = {
  sensors: new Set(),  // ESP32 传感器
  browsers: new Set()  // 浏览器客户端
};

wss.on('connection', (ws, req) => {
  console.log('New connection from:', req.socket.remoteAddress);
  
  // 默认作为浏览器客户端
  let clientType = 'browser';
  clients.browsers.add(ws);
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      // 识别客户端类型
      if (data.type === 'sensor_data') {
        // 这是 ESP32 传感器
        if (clientType === 'browser') {
          clients.browsers.delete(ws);
          clients.sensors.add(ws);
          clientType = 'sensor';
          console.log('Client identified as: ESP32 Sensor');
        }
        
        // 转发传感器数据到所有浏览器
        const payload = JSON.stringify(data);
        clients.browsers.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
          }
        });
        
        // 打印传感器数据（调试用）
        console.log(`ToF: ${data.tof.distance}mm, Gesture: ${data.gesture}`);
      }
      else if (data.type === 'browser_command') {
        // 浏览器发送的命令，转发到传感器
        const payload = JSON.stringify(data);
        clients.sensors.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
          }
        });
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('Client disconnected');
    clients.sensors.delete(ws);
    clients.browsers.delete(ws);
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
  
  // 发送欢迎消息
  ws.send(JSON.stringify({
    type: 'welcome',
    message: 'Connected to Hanabi Sensor Bridge',
    timestamp: Date.now()
  }));
});

server.listen(PORT, () => {
  console.log(`WebSocket server listening on port ${PORT}`);
  console.log(`Sensor endpoint: ws://localhost:${PORT}/sensor`);
});

// 定期清理断开的连接
setInterval(() => {
  clients.sensors.forEach(client => {
    if (client.readyState !== WebSocket.OPEN) {
      clients.sensors.delete(client);
    }
  });
  clients.browsers.forEach(client => {
    if (client.readyState !== WebSocket.OPEN) {
      clients.browsers.delete(client);
    }
  });
}, 30000);

// 状态报告
setInterval(() => {
  console.log(`Connected - Sensors: ${clients.sensors.size}, Browsers: ${clients.browsers.size}`);
}, 10000);
