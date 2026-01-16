# 🚖 CAB Booking System

> **Microservices • Real-time • Event-driven • AI-enabled • Zero Trust Architecture**

A modern, cloud-native taxi booking platform built with microservices architecture, designed for scalability, reliability, real-time processing, and AI-powered intelligent matching.

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)](https://reactjs.org/)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-326CE5?style=flat&logo=kubernetes&logoColor=white)](https://kubernetes.io/)
[![Kafka](https://img.shields.io/badge/Apache%20Kafka-231F20?style=flat&logo=apache-kafka&logoColor=white)](https://kafka.apache.org/)
[![AWS](https://img.shields.io/badge/AWS-232F3E?style=flat&logo=amazon-aws&logoColor=white)](https://aws.amazon.com/)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [Microservices](#-microservices)
- [Getting Started](#-getting-started)
- [Documentation](#-documentation)
- [Security](#-security)
- [AI & Machine Learning](#-ai--machine-learning)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

The **CAB Booking System** is an enterprise-grade ride-hailing platform that connects passengers, drivers, and operators in real-time. The system leverages:

- **Microservices Architecture**: Independent, scalable services
- **Event-Driven Design**: Asynchronous communication via Kafka/RabbitMQ
- **Real-time Processing**: WebSocket for live GPS tracking and updates
- **AI-Powered Matching**: Intelligent driver-passenger matching algorithms
- **Zero Trust Security**: End-to-end encryption and authentication
- **Cloud-Native**: Kubernetes orchestration with multi-region support

### 🎓 Academic Context

This project serves as a comprehensive **System Design Document** suitable for:
- University thesis (Information Systems major)
- Technical documentation for development & operations teams
- Reference architecture for microservices implementation

---

## 🏗️ Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Customer   │  │    Driver    │  │    Admin     │      │
│  │     App      │  │     App      │  │  Dashboard   │      │
│  │  (React.js)  │  │  (React.js)  │  │  (React.js)  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                    HTTPS / WebSocket
                            │
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway Layer                        │
│                      (Node.js)                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Routing • Auth • Rate Limiting • Load Balancing     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────────────┐  ┌────────────────┐  ┌───────────────┐
│ Auth Service  │  │ Booking Service│  │ Ride Service  │
└───────────────┘  └────────────────┘  └───────────────┘
        │                   │                   │
┌───────────────┐  ┌────────────────┐  ┌───────────────┐
│ User Service  │  │ Driver Service │  │Payment Service│
└───────────────┘  └────────────────┘  └───────────────┘
        │                   │                   │
┌───────────────┐  ┌────────────────┐  ┌───────────────┐
│Pricing Service│  │ Review Service │  │Notification   │
└───────────────┘  └────────────────┘  │   Service     │
                                        └───────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
        ┌───────────────┐      ┌───────────────┐
        │ Message Broker│      │  Data Layer   │
        │ Kafka/RabbitMQ│      │ PostgreSQL    │
        └───────────────┘      │ MongoDB       │
                               │ Redis         │
                               └───────────────┘
```

### Architecture Principles

- **Database per Service**: Each microservice owns its data
- **Stateless Services**: Horizontal scaling without session affinity
- **Async-First**: Event-driven communication for loose coupling
- **Zero Trust**: Never trust, always verify
- **Observability by Design**: Built-in monitoring and logging

---

## ✨ Key Features

### For Passengers
- 📍 **Real-time GPS Tracking**: Live driver location updates
- 💰 **Dynamic Pricing**: AI-powered surge pricing based on demand
- 🚗 **Multiple Vehicle Options**: Economy, Premium, XL
- 💳 **Multiple Payment Methods**: Cash, Card, Wallet
- ⭐ **Rating & Reviews**: Rate drivers and provide feedback
- 📜 **Ride History**: Complete trip history and receipts

### For Drivers
- 📱 **Real-time Ride Requests**: Instant notifications for new rides
- 🗺️ **Navigation Integration**: Turn-by-turn directions
- 💵 **Earnings Dashboard**: Track daily/weekly income
- 📊 **Performance Analytics**: Rating and trip statistics
- 🔔 **Smart Notifications**: Push notifications for ride updates

### For Administrators
- 📊 **Real-time Dashboard**: Monitor system KPIs
- 👥 **User Management**: Manage passengers and drivers
- 🚦 **Ride Monitoring**: Track all active rides
- 💲 **Pricing Control**: Configure surge pricing rules
- 📈 **Analytics & Reports**: Business intelligence insights
- 🔍 **Audit Logs**: Complete system activity tracking

---

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: NestJS / Express.js
- **API**: REST + gRPC
- **Authentication**: JWT + OAuth2
- **Real-time**: Socket.IO / WebSocket

### Frontend
- **Framework**: React.js / Next.js
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Redux Toolkit / React Query
- **Maps**: Mapbox / Google Maps SDK

### Data Layer
- **Relational DB**: PostgreSQL (Users, Bookings, Payments)
- **NoSQL DB**: MongoDB (Reviews, Logs)
- **Cache**: Redis (Sessions, Geo-indexing)
- **Search**: OpenSearch / Elasticsearch (optional)

### Event & Messaging
- **Message Broker**: Apache Kafka / RabbitMQ
- **Streaming**: Kafka Streams
- **Schema Registry**: Confluent Schema Registry

### AI & Machine Learning
- **Training**: Python, PyTorch / TensorFlow
- **Serving**: FastAPI / TorchServe
- **Feature Store**: Feast
- **Pipeline**: Apache Airflow

### Infrastructure & DevOps
- **Cloud**: AWS / GCP / Azure
- **Container**: Docker
- **Orchestration**: Kubernetes
- **Service Mesh**: Istio / Linkerd
- **IaC**: Terraform
- **CI/CD**: GitHub Actions / GitLab CI

### Observability & Security
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack / OpenSearch
- **Tracing**: Jaeger
- **Secrets**: HashiCorp Vault
- **WAF**: Cloud WAF

---

## 🔧 Microservices

| Service | Responsibility | Database | Port |
|---------|---------------|----------|------|
| **Auth Service** | Authentication & Authorization (JWT) | PostgreSQL | 3001 |
| **User Service** | Passenger profile management | PostgreSQL | 3002 |
| **Driver Service** | Driver profile & availability | PostgreSQL | 3003 |
| **Ride Service** | Ride lifecycle (start, track, complete) | PostgreSQL | 3004 |
| **Booking Service** | Ride requests & dispatching | PostgreSQL | 3005 |
| **Pricing Service** | Fare calculation & surge pricing | Redis | 3006 |
| **Payment Service** | Transaction processing | PostgreSQL | 3007 |
| **Review Service** | Ratings & feedback | MongoDB | 3008 |
| **Notification Service** | Push notifications, Email, SMS | MongoDB | 3009 |
| **AI Matching Service** | Intelligent driver-passenger matching | Redis | 3010 |

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.x
- Docker & Docker Compose
- Kubernetes (optional, for production)
- PostgreSQL 15+
- MongoDB 6+
- Redis 7+
- Kafka / RabbitMQ

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ManhPhuc204/CabBookingSystemN32.git
   cd CabBookingSystemN32
   ```

2. **Install dependencies for each service**
   ```bash
   # Example for auth-service
   cd services/auth-service
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start infrastructure services**
   ```bash
   docker-compose up -d postgres mongodb redis kafka
   ```

5. **Run microservices**
   ```bash
   # Start each service (or use PM2/Docker Compose)
   cd services/auth-service && npm run dev
   cd services/user-service && npm run dev
   # ... repeat for other services
   ```

6. **Start API Gateway**
   ```bash
   cd api-gateway
   npm run dev
   ```

7. **Start frontend applications**
   ```bash
   # Customer App
   cd client/customer-app
   npm install && npm start

   # Driver App
   cd client/driver-app
   npm install && npm start

   # Admin Dashboard
   cd client/admin-dashboard
   npm install && npm start
   ```

### Docker Deployment

```bash
# Build all services
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### Kubernetes Deployment

```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -n cab-booking

# Access services
kubectl port-forward svc/api-gateway 8080:80 -n cab-booking
```

---

## 📚 Documentation

Comprehensive documentation is available in the [`docs/`](./docs) folder:

- **[Architecture](./docs/architecture.md)**: Detailed system architecture
- **[API Specification](./docs/api-spec.md)**: REST API endpoints
- **[Sequence Diagrams](./docs/sequence-diagram.md)**: End-to-end workflows

### Key Workflows

1. **Ride Booking Flow**: Customer → API Gateway → Booking → AI Matching → Driver
2. **Payment Flow**: Ride Complete → Payment Service → PSP → Notification
3. **Real-time GPS**: Driver → WebSocket → Ride Service → Customer
4. **AI Matching**: Booking → AI Service → Feature Store → Optimal Driver Selection

---

## 🔒 Security

### Zero Trust Architecture

The system implements **Zero Trust** security principles:

- ✅ **Never trust, always verify**: All requests authenticated
- ✅ **mTLS**: Service-to-service encryption
- ✅ **JWT + OAuth2**: Token-based authentication
- ✅ **RBAC & ABAC**: Role and attribute-based access control
- ✅ **API Gateway as PEP**: Policy enforcement point
- ✅ **Secrets Management**: HashiCorp Vault integration
- ✅ **Audit Logging**: Complete activity tracking
- ✅ **WAF Protection**: SQL injection, XSS, DDoS prevention

### Security Layers

```
┌─────────────────────────────────────────┐
│  WAF + Rate Limiting + DDoS Protection  │
├─────────────────────────────────────────┤
│  API Gateway: JWT Validation + RBAC     │
├─────────────────────────────────────────┤
│  Service Mesh: mTLS + Service Identity  │
├─────────────────────────────────────────┤
│  Data Encryption: At-rest + In-transit  │
└─────────────────────────────────────────┘
```

---

## 🤖 AI & Machine Learning

### AI Use Cases

1. **Intelligent Driver Matching**
   - Optimize based on distance, rating, ETA
   - Reduce wait time and improve satisfaction

2. **Dynamic Surge Pricing**
   - Real-time demand-supply analysis
   - Historical data + event-based pricing

3. **ETA Prediction**
   - Traffic-aware time estimation
   - Continuous learning from actual trips

4. **Fraud Detection**
   - Anomaly detection in booking patterns
   - Payment fraud prevention

### AI Architecture

```
┌──────────────────────────────────────────────┐
│           AI/ML Platform                     │
│  ┌────────────┐  ┌────────────┐             │
│  │  Feature   │  │   Model    │             │
│  │   Store    │  │  Training  │             │
│  └────────────┘  └────────────┘             │
│  ┌────────────┐  ┌────────────┐             │
│  │   Model    │  │  Inference │             │
│  │  Registry  │  │   Service  │             │
│  └────────────┘  └────────────┘             │
└──────────────────────────────────────────────┘
           │                │
           ▼                ▼
    ┌─────────────┐  ┌─────────────┐
    │  Matching   │  │   Pricing   │
    │  Service    │  │   Service   │
    └─────────────┘  └─────────────┘
```

---

## 🌐 Deployment

### Cloud Architecture (AWS Example)

```
┌─────────────────────────────────────────────────┐
│              Route 53 (DNS)                     │
└─────────────────────────────────────────────────┘
                      │
┌─────────────────────────────────────────────────┐
│         CloudFront (CDN) + WAF                  │
└─────────────────────────────────────────────────┘
                      │
┌─────────────────────────────────────────────────┐
│    Application Load Balancer (ALB)             │
└─────────────────────────────────────────────────┘
                      │
┌─────────────────────────────────────────────────┐
│         EKS (Kubernetes Cluster)                │
│  ┌──────────────────────────────────────┐      │
│  │     Microservices Pods               │      │
│  │  (Auto-scaling with HPA)             │      │
│  └──────────────────────────────────────┘      │
└─────────────────────────────────────────────────┘
           │              │              │
    ┌──────────┐   ┌──────────┐   ┌──────────┐
    │   RDS    │   │ ElastiC  │   │   MSK    │
    │(Postgres)│   │  ache    │   │ (Kafka)  │
    │          │   │ (Redis)  │   │          │
    └──────────┘   └──────────┘   └──────────┘
```

### Scalability Features

- **Horizontal Pod Autoscaling (HPA)**: Auto-scale based on CPU/memory
- **Multi-region Deployment**: High availability across regions
- **CDN Integration**: Fast content delivery globally
- **Database Replication**: Read replicas for high throughput
- **Caching Strategy**: Redis for hot data, reducing DB load

### Cost Estimation

| Scale | MAU | Estimated Monthly Cost (USD) |
|-------|-----|------------------------------|
| Startup | 10K | $500 - $800 |
| Scale-up | 100K | $2,500 - $4,000 |
| Enterprise | 1M+ | $15,000+ |

---

## 🧪 Testing

### Testing Strategy

- **Unit Tests**: Jest + Mocha
- **Integration Tests**: Supertest
- **E2E Tests**: Cypress / Playwright
- **Load Testing**: k6 / Artillery
- **Contract Testing**: Pact

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Load testing
k6 run tests/load/booking-flow.js
```

---

## 📊 Monitoring & Observability

### Observability Stack

```
┌─────────────────────────────────────────┐
│         Grafana (Visualization)         │
└─────────────────────────────────────────┘
           │              │
    ┌──────────┐   ┌──────────┐
    │Prometheus│   │  Jaeger  │
    │(Metrics) │   │(Tracing) │
    └──────────┘   └──────────┘
           │              │
┌─────────────────────────────────────────┐
│      ELK Stack (Centralized Logs)       │
│  Elasticsearch + Logstash + Kibana      │
└─────────────────────────────────────────┘
```

### Key Metrics

- **Request Rate**: Requests per second
- **Error Rate**: 4xx/5xx errors
- **Latency**: P50, P95, P99
- **Throughput**: Messages processed
- **Availability**: Uptime percentage

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- Write tests for new features
- Update documentation
- Follow conventional commits

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Authors

- **Manh Phuc** - [GitHub](https://github.com/ManhPhuc204)

---

## 🙏 Acknowledgments

- Inspired by Uber, Grab, and Lyft architectures
- Built with modern cloud-native technologies
- Designed for academic and production use

---

## 📞 Contact & Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/ManhPhuc204/CabBookingSystemN32/issues)
- **Email**: [Your Email]
- **Documentation**: [Full Documentation](./docs)

---

<div align="center">



</div>
