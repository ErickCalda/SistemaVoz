const admin = require('firebase-admin');
require('dotenv').config();

/**
 * Firebase Admin SDK initialization
 * In production, you should use environment variables for all sensitive credentials
 */
const initializeFirebaseAdmin = () => {
  if (admin.apps.length) return;

  try {
    // Usar el objeto de credenciales completo directamente
    const serviceAccount = {
      type: "service_account",
      project_id: "apis-practicas",
      private_key_id: "c18218b12ecfbb36ec8e27b36ab921cd214ed484",
      private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDJrhslm+gjvHIk\nARMUFHHM/uUrSSECVkVbpCsR6OKSMlgxjGdqQ1sw25ss8tykNs+4o4yTvG1Qz/77\naYNrE3IpuIbsS9qVee7ogC3YobB6045SnGs0/bmorm4Xqe1o94ySRGUKRmU54OkN\n2r+SrtC1JMzxYf5pVeVzKwRuQ9GaQ/Sd2okjRtTDqgm2Uv0SVP80P1ZVahFSCQS3\n7wV5TeQt8bZegqnfr61Bx22qbuQu7wvSJgcctTkpOTlfruHMt3Fl/WHO7IrJxJXN\nJ+CauSkSo9bor6VKEtaETlEGsVSX0hKljmYszq+KyxxVT4yq34CvudclZB0YTmeN\nmdjZSRDhAgMBAAECggEAAhj+5x7R+jQQeqFVAjeYjYbrDxzVoc6sg2QibRn0oRok\nOb4mL/yrv3/tPCskYIQXGCpzh+Jk+FeC0AA4wAFFzPQe58yMD/AblsWI+BfRUYDW\nL3ryEGXzEpcKFCdt/3XoyaIdiJYFBOYstXp8f/6mFq2RSANTcCqlEreNLymilO+S\nUr6zeMuOsnkWlcQTs6pRtOcZ0o5rrZfvLmfh4l+rn2unuLIoFmnhZ3BBgvLM7Qdy\nH+4nlHN6z6zk4y8aeRiDPtwtA7GQaESYveAGQoPpPGavZ6NGrcvTcVrGjjUm4peb\n7wSBQQIp2MXyujhMbL25emqQejjOSTqAxaOEo9AGhQKBgQDz08FggCLr0Tvxla0n\nzP1kB65aT9c2uDuFGphV2Otz6p2mkYutqlYk3B7vwyDxKYn30NFpK5D9xdwGNkHZ\nPsYv9yaAWNKmmh/imYJMBEtZbAbIYhYRqzZoE7y/OSh4jMILm/UoipH5ytwFagCT\n07Hko7C9vWj8olbCK4Cf6WFJhQKBgQDTv7AmBSmL26HpMeTuBPTGtWAw7YpAx9Ry\nlQAHtxXwdAF6Vv04u0WM3heNgbOA5G9b3kGdpDYxIIUPKWM7CPII9/Xxe3nCHU1A\nki3MIrDMBJOCzxQkdRPc3HYv4WdGMd+J3TCwmpmyJ0qczBse92Zc3itWI+hdzPrD\n3ZJKLs16rQKBgADHDxnQrsvTuf42PPwggjpcb+jn0kbhZYcyI4Q6kd2nxOLwGeLu\n5SFu9kZLeAJs4HzC1LgiJG86v03hxGn98kHa5uuH3PwdB7cASFMXvGnHl2nyLiHW\nSvEgBv0RIJjp0gCZebmsX3TNedAmm2PdS/bvsrOYNAqCNgaefuWDqATFAoGBAMNj\nGK4si0ajVoawZHcBGcCVsnnTZoQaID3OoWV9GoBy+r4hsKz9mNLASGlpqfIgV2Uk\n89T7pom0YTM5VHgv6+48p7O45QQqN5OCj0HTLOJEwrysSgDOC5L71w6dZcdO098J\nvBjpvzK1sNJ4P/pV/R1qYACvR4XuU+IR/R/4ieBNAoGBAKMQjn1kvdVsBloRkpp8\nvScvNh/yLjD0+/wDyrryiqgExmthgQPcJu5KugstN3/jk8ULgPdDfHEvRsUjS/L2\nlPie5i3tFlKRFJRxPHVYdnQTcfATq9NvFGYsVHuwWRxtfiiOfcnIfwUXTbXpFbZk\nqJEQ7B5w21GtoCiLnKcQkr+e\n-----END PRIVATE KEY-----\n",
      client_email: "firebase-adminsdk-49r50@apis-practicas.iam.gserviceaccount.com",
      client_id: "103276606282001225587",
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-49r50%40apis-practicas.iam.gserviceaccount.com",
      universe_domain: "googleapis.com"
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
  }
};

module.exports = { initializeFirebaseAdmin };
