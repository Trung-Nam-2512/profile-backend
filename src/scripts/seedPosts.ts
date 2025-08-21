import dotenv from 'dotenv'
import { connectDatabase, disconnectDatabase } from '../utils/database'
import { PostModel } from '../models/Post'
import { UserModel } from '../models/User'

// Load environment variables
dotenv.config()

const seedPosts = async () => {
  try {
    console.log('🌱 Starting posts seeding...')

    // Connect to database
    await connectDatabase()

    // Find admin user
    const adminUser = await UserModel.findOne({ role: 'ADMIN' })
    if (!adminUser) {
      console.error('❌ Admin user not found. Please run seed-admin first.')
      return
    }

    // Check if posts already exist
    const existingPosts = await PostModel.countDocuments()
    if (existingPosts > 3) {
      console.log('✅ Posts already exist, skipping seeding')
      return
    }

    // Sample posts
    const samplePosts = [
      {
        title: 'Làm Sao Có Tư Duy Triển Khai Hệ Thống',
        slug: 'lam-sao-co-tu-duy-trien-khai-he-thong',
        excerpt:
          'Khám phá những nguyên tắc cơ bản để thiết kế và triển khai hệ thống software hiệu quả, từ kiến trúc đến deployment.',
        content: `# Làm Sao Có Tư Duy Triển Khai Hệ Thống

## Giới thiệu

Triển khai hệ thống software không chỉ là việc code và deploy. Đó là nghệ thuật kết hợp giữa **technical skills** và **system thinking** để tạo ra solutions bền vững.

## Những Nguyên Tắc Cơ Bản

### 1. Think Big, Start Small
- Bắt đầu với **MVP** (Minimum Viable Product)
- Scale từng bước một cách có kiểm soát
- Luôn có **rollback plan**

### 2. Kiến Trúc Modular
Thiết kế hệ thống theo modules để dễ maintain và scale.

### 3. Monitoring & Observability
- **Logs**: Ghi lại mọi hành động quan trọng
- **Metrics**: CPU, Memory, Response time
- **Alerts**: Phát hiện sớm vấn đề

## Database Design

Thiết kế database schema có thể evolution theo thời gian.

## Security First

### Authentication & Authorization
- **JWT** cho stateless auth
- **Role-based** access control
- **Input validation** ở mọi layer

### Data Protection
- Encrypt sensitive data
- HTTPS everywhere
- Regular security audits

## Performance Considerations

### Database Optimization
- **Indexes** cho queries thường dùng
- **Connection pooling**
- **Query optimization**

### Caching Strategy
Implement caching để giảm load database và tăng response time.

## Deployment Strategy

### Environment Management
- **Development**: Local testing
- **Staging**: Pre-production validation  
- **Production**: Live system

### CI/CD Pipeline
1. **Code commit** → Git repository
2. **Automated tests** → Pass/Fail gate
3. **Build** → Create deployable artifact
4. **Deploy** → Rolling deployment
5. **Verify** → Health checks

## Troubleshooting Mindset

### When Things Go Wrong
1. **Don't panic** - Take systematic approach
2. **Check logs** first
3. **Roll back** if necessary
4. **Post-mortem** analysis

### Common Issues
- **Memory leaks**: Use profiling tools
- **Database locks**: Analyze slow queries
- **Network timeouts**: Check infrastructure

## Tools & Technologies

### Development
- **Version Control**: Git with proper branching
- **Testing**: Unit + Integration + E2E
- **Code Quality**: ESLint, SonarQube

### Infrastructure  
- **Containerization**: Docker
- **Orchestration**: Kubernetes
- **Monitoring**: Prometheus, Grafana
- **Logging**: ELK Stack

## Best Practices Summary

### Code Organization
Organize code theo layers: Controllers, Services, Repositories.

### Documentation
- **README**: Project overview
- **API Docs**: OpenAPI/Swagger
- **Architecture**: High-level diagrams
- **Runbooks**: Operational procedures

## Kết Luận

Tư duy triển khai hệ thống là kết hợp giữa:
- **Technical expertise**: Biết dùng tools và technologies
- **System thinking**: Nhìn toàn cục và tương lai
- **Practical experience**: Học từ failures và successes

**Next Steps:**
1. Thực hành với pet projects
2. Đọc case studies của big tech
3. Tham gia open source projects

---

*Bạn đã từng gặp challenges gì khi triển khai hệ thống? Share experience trong comments nhé! 🚀*`,
        tags: [
          'system-design',
          'architecture',
          'backend',
          'devops',
          'best-practices',
        ],
        published: true,
        authorId: String(adminUser._id),
        publishedAt: new Date(),
      },
      {
        title: 'React Performance Optimization - 5 Kỹ Thuật Hiệu Quả',
        slug: 'react-performance-optimization-ky-thuat-hieu-qua',
        excerpt:
          'Tăng tốc React application với 5 kỹ thuật optimization quan trọng: React.memo, useMemo, useCallback, code splitting và lazy loading.',
        content: `# React Performance Optimization - 5 Kỹ Thuật Hiệu Quả

## Tại Sao Performance Quan Trọng?

React app chậm = User experience kém = Bounce rate cao = Revenue giảm. 

**Statistics:**
- 1 giây delay = 7% conversion loss
- 40% users rời trang nếu load > 3 giây
- Mobile users kỳ vọng load < 2 giây

## Kỹ Thuật 1: React.memo

Wrap components với React.memo để tránh re-render không cần thiết.

## Kỹ Thuật 2: useMemo Hook

Sử dụng useMemo cho expensive calculations và heavy filtering/sorting.

## Kỹ Thuật 3: useCallback Hook

Memoize functions với useCallback để tránh tạo new functions mỗi render.

## Kỹ Thuật 4: Code Splitting

### Route-based Splitting
Import components với lazy loading để giảm initial bundle size.

### Component-based Splitting  
Lazy load heavy components chỉ khi cần thiết.

## Kỹ Thuật 5: Virtualization

Sử dụng virtualization cho lists có nhiều items (1000+).

## Performance Measurement

### React DevTools Profiler
1. Install React DevTools extension
2. Go to Profiler tab  
3. Click record → interact → stop
4. Analyze render times

## Kết Quả Đo Lường

### Before Optimization
- Initial bundle: **2.5MB**
- FCP: **4.2s**
- LCP: **6.8s**
- React renders: **1,247**

### After Optimization  
- Initial bundle: **750KB** (-70%)
- FCP: **1.8s** (-57%)
- LCP: **2.4s** (-65%)
- React renders: **89** (-93%)

## Best Practices

### Do's ✅
- Profile before optimizing
- Measure real-world impact
- Use React DevTools Profiler
- Optimize critical rendering path
- Lazy load non-essential features

### Don'ts ❌
- Premature optimization
- Memo everything blindly  
- Ignore bundle size
- Skip performance budgets
- Optimize without measuring

## Kết Luận

React performance optimization là marathon, không phải sprint. Hãy:

1. **Measure first** - Profile trước khi optimize
2. **Focus on impact** - Ưu tiên bottlenecks lớn nhất
3. **Test thoroughly** - Đảm bảo không break functionality
4. **Monitor continuously** - Track performance metrics

**Your turn**: Implement một trong 5 kỹ thuật này vào project của bạn và share kết quả! 🚀

---

*Bạn đã thử technique nào? Performance improvement bao nhiêu %? Comment below!*`,
        tags: [
          'react',
          'performance',
          'optimization',
          'javascript',
          'frontend',
        ],
        published: true,
        authorId: String(adminUser._id),
        publishedAt: new Date(Date.now() - 86400000), // 1 day ago
      },
      {
        title: 'Docker Tutorial - Containerization cho Beginners',
        slug: 'docker-tutorial-containerization-cho-beginners',
        excerpt:
          'Học Docker từ cơ bản đến nâng cao: tạo containers, Dockerfile, docker-compose và best practices cho development.',
        content: `# Docker Tutorial - Containerization cho Beginners

## Docker Là Gì?

Docker là platform giúp **package** applications cùng với tất cả dependencies thành **containers** - portable units có thể chạy ở bất kỳ đâu.

### Tại Sao Cần Docker?

**Problem**: "It works on my machine" 😅

**Solution**: Container đóng gói everything!

## Core Concepts

### Images vs Containers
- **Image** = Template/Blueprint
- **Container** = Running instance of image

### Dockerfile
Recipe để build image với các steps như copy files, install dependencies, expose ports.

## Getting Started

### Installation
1. Download **Docker Desktop**
2. Install và start
3. Verify installation

### First Container
Chạy hello-world container để test Docker installation.

## Real Project Example

### Node.js Application
Tạo simple Express app và containerize nó.

### Dockerfile
FROM node:16-alpine, set WORKDIR, copy files, install deps, expose port, start app.

### Build & Run
Build image và run container với port mapping.

## Docker Compose

### Multi-service Applications
Setup app với database và cache sử dụng docker-compose.yml.

### Commands
- docker-compose up: start all services
- docker-compose down: stop all services
- docker-compose logs: view logs

## Production Best Practices

### Multi-stage Builds
Optimize image size với separate build và runtime stages.

### Security
- Use specific versions (not latest)
- Create non-root user
- Use .dockerignore

## Development Workflow

### Hot Reload Setup
Setup development environment với volume mounting cho live reload.

## Debugging

### Common Issues
- Check container status với docker ps
- View logs với docker logs
- Access container shell với docker exec

## Useful Commands Cheatsheet

### Images
- docker images: list images
- docker rmi: remove image
- docker image prune: cleanup

### Containers  
- docker ps: list containers
- docker stop/start: control containers
- docker rm: remove container

## Next Steps

### Learn More
1. **Kubernetes**: Container orchestration
2. **Docker Swarm**: Docker's native clustering  
3. **CI/CD**: Automated deployments
4. **Security**: Container scanning, secrets management

### Practice Projects
- Dockerize existing Node.js/Python app
- Multi-service app với database
- Setup CI/CD pipeline với Docker
- Deploy to cloud platforms

---

**Challenge**: Dockerize một project hiện tại của bạn và share experience! Container có giúp deployment dễ dàng hơn không? 🐳`,
        tags: [
          'docker',
          'devops',
          'containerization',
          'deployment',
          'tutorial',
        ],
        published: false, // Draft post
        authorId: String(adminUser._id),
      },
    ]

    // Create posts
    await PostModel.insertMany(samplePosts)

    console.log(`✅ Created ${samplePosts.length} sample posts`)
    console.log('📄 Posts:')
    samplePosts.forEach(post => {
      console.log(
        `   - ${post.title} (${post.published ? 'Published' : 'Draft'})`
      )
    })
  } catch (error) {
    console.error('❌ Error seeding posts:', error)
    process.exit(1)
  } finally {
    await disconnectDatabase()
    process.exit(0)
  }
}

// Run the seed function if this script is executed directly
if (require.main === module) {
  seedPosts()
}

export { seedPosts }
