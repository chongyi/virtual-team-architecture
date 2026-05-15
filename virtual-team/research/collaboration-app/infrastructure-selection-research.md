# 基础设施选型调研

## 调研问题

协作应用需要选择外部第三方系统和配套设施。目标是在第一阶段降低运维复杂度，同时保留未来拆分、扩容和云厂商迁移空间。

## 资料来源

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [PostgreSQL Full Text Search](https://www.postgresql.org/docs/current/textsearch.html)
- [PostgreSQL pg_trgm](https://www.postgresql.org/docs/current/pgtrgm.html)
- [Redis Streams](https://redis.io/docs/latest/develop/data-types/streams/)
- [Redis XREADGROUP](https://redis.io/docs/latest/commands/xreadgroup/)
- [OpenTelemetry Collector](https://opentelemetry.io/docs/collector/)
- [Amazon S3 API compatibility overview](https://docs.aws.amazon.com/AmazonS3/latest/API/Welcome.html)
- [MinIO S3 compatibility](https://min.io/docs/minio/linux/reference/s3-api-compatibility.html)
- [Meilisearch documentation](https://www.meilisearch.com/docs)
- [Typesense documentation](https://typesense.org/docs/)
- [OpenSearch documentation](https://opensearch.org/docs/latest/)
- [NATS JetStream documentation](https://docs.nats.io/nats-concepts/jetstream)
- [Apache Kafka documentation](https://kafka.apache.org/documentation/)

## 关键结论

### 云中立设施优先

协作应用早期不应直接绑定某个云厂商的产品名。方案层使用 PostgreSQL、Redis、S3-compatible object storage、OpenTelemetry Collector 等通用能力描述，落地部署时再映射到 RDS、ElastiCache、S3、OSS、GCS、MinIO 或其他托管服务。

决策：

- 生产方案写云中立设施。
- 部署文档可以在环境层说明某云厂商映射。
- 代码通过 adapter 访问对象存储、推送和 Secret，不直接把云 SDK 泄漏到业务层。

### PostgreSQL 适合作为第一阶段权威业务库

协作应用的消息、组织、对象壳、权限、审计、扩展数据和 outbox 都需要事务、索引和关系查询。PostgreSQL 同时支持 JSONB、全文搜索、pg_trgm 和成熟备份/复制生态。

决策：

- 第一阶段权威业务数据使用 PostgreSQL。
- PostgreSQL FTS + pg_trgm 作为第一阶段统一搜索起点。
- 搜索体验和规模提升后再迁移专用搜索服务。

### Redis 适合作为缓存、presence 和事件分发辅助

Redis 能承载在线状态、短期缓存、限流和 Redis Streams 任务分发。但 Redis 不应成为业务权威数据源。

决策：

- Redis 用于 presence、短期缓存、限流、worker fanout。
- Redis Streams 可以消费 outbox 派生任务。
- 权威事件仍在 PostgreSQL outbox。

### S3-compatible 对象存储降低云绑定

附件、图片、导出文件和缩略图适合对象存储。S3 API 兼容生态广泛，MinIO 可用于本地开发或私有化部署。

决策：

- 代码层面使用 S3-compatible abstraction。
- 本地开发使用 MinIO。
- 生产按云环境映射到具体对象存储。

### 搜索和队列采用渐进式升级

第一阶段直接引入 OpenSearch/Kafka 会显著增加运维复杂度。更稳妥的路径是 PostgreSQL FTS 起步、Redis Streams 辅助，等搜索体验、吞吐或保留需求明确后再迁移。

决策：

- 搜索：PostgreSQL FTS -> Meilisearch/Typesense -> OpenSearch。
- 队列：PostgreSQL outbox + Redis Streams -> NATS JetStream/Kafka。

## 风险

- 如果把 Redis Streams 当权威事件源，业务写入和副作用会出现一致性风险。
- 如果第一阶段直接上重型搜索/消息系统，运维成本会超过产品验证阶段需求。
- 如果对象存储直接绑定云厂商 SDK，后续私有化和多云迁移成本会提高。
