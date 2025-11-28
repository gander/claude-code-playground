# Deployment Documentation

Documentation for deploying and operating the OSM Tagging Schema MCP Server in production environments.

## Deployment Guides

- **[Deployment](deployment.md)** - Docker Compose deployment with health checks
- **[Docker On-Demand](docker-on-demand.md)** - On-demand Docker builds for Pull Requests
- **[Security](security.md)** - Security features, provenance, SLSA, and SBOM

## Deployment Options

### Docker (Recommended)
- Multi-architecture support (amd64, arm64)
- Health checks included
- Security hardened images

### NPM Package
- Direct execution via npx
- Source code deployment
- Custom integration scenarios

## Production Features

- **Transport Protocols**: stdio (default), HTTP/SSE for web clients
- **Health Endpoints**: `/health` (liveness), `/ready` (readiness)
- **Security**: Image signing, vulnerability scanning, SLSA Level 3 provenance
- **Monitoring**: Structured logging with configurable levels

## Quick Deployment

```bash
# Docker Compose (recommended)
curl -fsSL https://raw.githubusercontent.com/gander-tools/osm-tagging-schema-mcp/master/docker-compose.yml -o docker-compose.yml
docker-compose up -d
```

## Security

The package includes comprehensive supply chain security:
- NPM provenance attestations (SLSA Level 3)
- Docker image signing with Cosign
- SBOM (Software Bill of Materials) generation
- Automated vulnerability scanning

## Links

- **[User Documentation](../user/README.md)** - For setup and configuration
- **[API Documentation](../api/README.md)** - For integration details
- **[Development Documentation](../development/README.md)** - For contributors

## Support

For deployment issues:
1. Check [deployment guide](deployment.md) troubleshooting section
2. Review [security documentation](security.md) for verification steps
3. Open issues for deployment problems
4. Contact maintainers for enterprise support