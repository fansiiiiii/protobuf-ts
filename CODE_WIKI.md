# Protobuf-TS Code Wiki

## 1. 项目概述

`protobuf-ts` 是一个用于 **Protocol Buffers** 和 **RPC** 的纯 TypeScript 实现库，支持 Node.js 和 Web 浏览器环境。该项目提供了从 `.proto` 文件生成 TypeScript 代码的能力，并支持多种 RPC 协议（gRPC、gRPC-web、Twirp）。

### 核心特性

| 特性 | 描述 |
|------|------|
| 二进制格式 | 实现 protobuf 二进制序列化/反序列化 |
| JSON 格式 | 实现规范的 proto3 JSON 格式 |
| gRPC 支持 | 原生 gRPC 客户端和服务端支持 |
| gRPC-web | 浏览器端 gRPC-web 支持 |
| Twirp | Twirp 协议支持 |
| BigInt | 原生支持 64 位整数的 bigint 类型 |
| 反射 | 提供完整的反射信息和自定义选项 |
| Well-Known Types | 支持所有标准 WKT 类型 |

---

## 2. 项目架构

### 2.1 模块架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        用户应用层                                │
├─────────────────────────────────────────────────────────────────┤
│  Generated Code  ◄─── protoc --ts_out . ─── @protobuf-ts/plugin │
├─────────────────────────────────────────────────────────────────┤
│                        RPC 传输层                                │
│  @protobuf-ts/grpc-transport    @protobuf-ts/grpcweb-transport │
│  @protobuf-ts/twirp-transport   @protobuf-ts/grpc-backend       │
├─────────────────────────────────────────────────────────────────┤
│                    @protobuf-ts/runtime-rpc                      │
│  RPC 抽象层：RpcTransport、RpcError、ServiceType、Call 类型       │
├─────────────────────────────────────────────────────────────────┤
│                     @protobuf-ts/runtime                         │
│  核心运行时：MessageType、二进制/JSON 序列化、反射操作            │
├─────────────────────────────────────────────────────────────────┤
│                   @protobuf-ts/plugin-framework                  │
│  protoc 插件开发框架：Descriptor 处理、代码生成工具              │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 模块职责

| 模块 | 职责 |
|------|------|
| `@protobuf-ts/runtime` | 核心运行时库，提供消息类型定义、序列化/反序列化、反射操作 |
| `@protobuf-ts/runtime-rpc` | RPC 抽象层，定义传输接口和调用类型 |
| `@protobuf-ts/plugin` | protoc 插件，生成 TypeScript 代码 |
| `@protobuf-ts/plugin-framework` | 插件开发框架，提供描述符解析和代码生成工具 |
| `@protobuf-ts/grpc-transport` | gRPC 传输实现，基于 `@grpc/grpc-js` |
| `@protobuf-ts/grpcweb-transport` | gRPC-web 传输实现，基于 Fetch API |
| `@protobuf-ts/twirp-transport` | Twirp 协议传输实现 |
| `@protobuf-ts/grpc-backend` | gRPC 服务端适配器 |

---

## 3. 核心模块详解

### 3.1 @protobuf-ts/runtime

**主要功能**：提供消息类型的运行时支持，包括序列化、反序列化、反射等核心能力。

**核心文件结构**：

```
runtime/src/
├── message-type.ts          # MessageType 类实现
├── binary-reader.ts         # 二进制格式读取器
├── binary-writer.ts         # 二进制格式写入器
├── reflection-binary-reader.ts  # 反射式二进制读取
├── reflection-binary-writer.ts  # 反射式二进制写入
├── reflection-json-reader.ts    # 反射式 JSON 读取
├── reflection-json-writer.ts    # 反射式 JSON 写入
├── reflection-info.ts       # 反射信息类型定义
├── pb-long.ts               # 64 位整数处理
└── index.ts                 # 公共 API 导出
```

**关键类 - MessageType**

`MessageType<T>` 是消息类型的核心实现类，提供以下方法：

| 方法 | 功能 |
|------|------|
| `create(value?)` | 创建消息实例，支持部分数据初始化 |
| `clone(message)` | 克隆消息 |
| `equals(a, b)` | 深度比较两个消息 |
| `is(value)` | 类型检查 |
| `mergePartial(target, source)` | 合并部分数据 |
| `fromBinary(data)` | 从二进制数据解析消息 |
| `toBinary(message)` | 将消息序列化为二进制 |
| `fromJson(json)` | 从 JSON 解析消息 |
| `toJson(message)` | 将消息转换为 JSON |

**反射信息结构**

```typescript
interface MessageInfo {
    typeName: string;
    fields: FieldInfo[];
    options?: JsonValue;
}

interface FieldInfo {
    no: number;                    // 字段编号
    name: string;                  // 字段名
    kind: 'scalar' | 'enum' | 'message' | 'map';
    T: ScalarType | EnumInfo | MessageType | {key: ScalarType, value: MessageType};
    repeat: RepeatType;            // 'optional' | 'required' | 'repeated'
    opt?: boolean;                 // 是否为 proto3 optional
    oneof?: string;                // oneof 组名
    options?: JsonValue;           // 自定义选项
}
```

---

### 3.2 @protobuf-ts/runtime-rpc

**主要功能**：定义 RPC 调用的抽象层，提供统一的传输接口和调用类型。

**核心文件结构**：

```
runtime-rpc/src/
├── rpc-transport.ts          # RpcTransport 接口定义
├── rpc-error.ts              # RPC 错误类型
├── service-type.ts           # ServiceType 定义
├── unary-call.ts             # 一元调用类型
├── server-streaming-call.ts  # 服务端流调用类型
├── client-streaming-call.ts  # 客户端流调用类型
├── duplex-streaming-call.ts  # 双向流调用类型
├── rpc-interceptor.ts        # 拦截器机制
└── index.ts                  # 公共 API 导出
```

**关键接口 - RpcTransport**

```typescript
interface RpcTransport {
    mergeOptions(options?: Partial<RpcOptions>): RpcOptions;
    unary<I, O>(method: MethodInfo<I, O>, input: I, options: RpcOptions): UnaryCall<I, O>;
    serverStreaming<I, O>(method: MethodInfo<I, O>, input: I, options: RpcOptions): ServerStreamingCall<I, O>;
    clientStreaming<I, O>(method: MethodInfo<I, O>, options: RpcOptions): ClientStreamingCall<I, O>;
    duplex<I, O>(method: MethodInfo<I, O>, options: RpcOptions): DuplexStreamingCall<I, O>;
}
```

**调用类型层次**

| 调用类型 | 数据流模式 | 适用场景 |
|---------|-----------|---------|
| `UnaryCall` | 请求-响应 | 普通 RPC 调用 |
| `ServerStreamingCall` | 请求-流响应 | 服务端推送数据 |
| `ClientStreamingCall` | 流请求-响应 | 客户端批量上传 |
| `DuplexStreamingCall` | 双向流 | 实时双向通信 |

**拦截器机制**

```typescript
type NextUnaryFn<I, O> = (method: MethodInfo<I, O>, input: I, options: RpcOptions) => UnaryCall<I, O>;

interface RpcInterceptor {
    interceptUnary<I, O>(next: NextUnaryFn<I, O>): NextUnaryFn<I, O>;
    interceptServerStreaming<I, O>(next: NextServerStreamingFn<I, O>): NextServerStreamingFn<I, O>;
    // ... 其他方法
}
```

---

### 3.3 @protobuf-ts/plugin

**主要功能**：protoc 插件，将 `.proto` 文件转换为 TypeScript 代码。

**核心文件结构**：

```
plugin/src/
├── protobufts-plugin.ts       # 主插件类
├── interpreter.ts             # 选项解析器
├── our-options.ts             # 插件选项定义
├── file-table.ts              # 文件名管理
├── code-gen/                  # 代码生成器
│   ├── message-interface-generator.ts    # 消息接口生成
│   ├── message-type-generator.ts         # 消息类型生成
│   ├── enum-generator.ts                 # 枚举生成
│   ├── service-client-generator-generic.ts   # 通用客户端生成
│   ├── service-client-generator-grpc.ts      # gRPC 客户端生成
│   ├── service-server-generator-generic.ts   # 通用服务端生成
│   └── service-server-generator-grpc.ts      # gRPC 服务端生成
└── message-type-extensions/   # 消息类型扩展
```

**插件工作流程**

```
protoc 请求
    │
    ▼
解析 CodeGeneratorRequest
    │
    ▼
构建 DescriptorRegistry
    │
    ▼
解析插件选项 (our-options.ts)
    │
    ▼
遍历文件描述符
    │
    ├── 生成消息接口
    ├── 生成枚举定义
    ├── 生成 MessageType
    ├── 生成 ServiceType
    ├── 生成客户端代码
    └── 生成服务端代码
    │
    ▼
输出 CodeGeneratorResponse
```

**支持的插件选项**

| 类别 | 选项 | 说明 |
|------|------|------|
| 长整型处理 | `long_type_string` | 使用 string 存储 64 位整数 |
| | `long_type_number` | 使用 number 存储 |
| | `long_type_bigint` | 使用 bigint（默认） |
| 输出类型 | `output_typescript` | 输出 TypeScript（默认） |
| | `output_javascript` | 输出 JavaScript |
| 客户端 | `client_generic` | 生成通用客户端（默认） |
| | `client_grpc1` | 生成 gRPC 客户端 |
| | `client_none` | 不生成客户端 |
| 服务端 | `server_generic` | 生成通用服务端接口 |
| | `server_grpc1` | 生成 gRPC 服务端 |
| 优化 | `optimize_speed` | 优化速度（默认） |
| | `optimize_code_size` | 优化代码体积 |

---

### 3.4 @protobuf-ts/plugin-framework

**主要功能**：提供 protoc 插件开发的基础框架，处理描述符解析和代码生成工具。

**核心文件结构**：

```
plugin-framework/src/
├── plugin-base.ts              # 插件基类
├── descriptor-registry.ts      # 描述符注册表
├── descriptor-info.ts          # 描述符信息提取
├── symbol-table.ts             # 符号表管理
├── typescript-file.ts          # TypeScript 文件抽象
├── typescript-import-manager.ts # 导入管理
├── google/protobuf/compiler/plugin.ts  # 生成器请求/响应类型
└── google/protobuf/descriptor.ts       # 描述符类型
```

**PluginBase 基类**

```typescript
abstract class PluginBase<T extends GeneratedFile = GeneratedFile> {
    abstract generate(request: CodeGeneratorRequest): Promise<T[]> | T[];
    
    async run(): Promise<void> {
        // 读取 stdin -> 解析请求 -> 调用 generate() -> 写入 stdout
    }
}
```

---

### 3.5 传输层模块

#### 3.5.1 @protobuf-ts/grpc-transport

基于 `@grpc/grpc-js` 的原生 gRPC 传输实现，支持所有四种调用类型。

```typescript
class GrpcTransport implements RpcTransport {
    constructor(defaultOptions: GrpcOptions);
    unary<I, O>(method: MethodInfo<I, O>, input: I, options: GrpcCallOptions): UnaryCall<I, O>;
    serverStreaming<I, O>(...): ServerStreamingCall<I, O>;
    clientStreaming<I, O>(...): ClientStreamingCall<I, O>;
    duplex<I, O>(...): DuplexStreamingCall<I, O>;
    close(): void;
}
```

#### 3.5.2 @protobuf-ts/grpcweb-transport

基于 Fetch API 的 gRPC-web 传输实现，**不支持客户端流和双向流**。

```typescript
class GrpcWebFetchTransport implements RpcTransport {
    constructor(defaultOptions: GrpcWebOptions);
    
    // 不支持的方法会抛出错误
    clientStreaming<I, O>(...): ClientStreamingCall<I, O>;  // throws
    duplex<I, O>(...): DuplexStreamingCall<I, O>;          // throws
}
```

#### 3.5.3 @protobuf-ts/twirp-transport

Twirp 协议传输实现，支持一元调用。

---

## 4. 关键类与函数说明

### 4.1 MessageType 核心方法

| 方法签名 | 功能说明 |
|---------|---------|
| `create(value?: PartialMessage<T>): T` | 创建消息实例，可选传入初始数据 |
| `clone(message: T): T` | 深拷贝消息 |
| `equals(a: T, b: T): boolean` | 深度比较两个消息 |
| `is(arg: any, depth?: number): boolean` | 类型守卫，检查是否匹配消息类型 |
| `mergePartial(target: T, source: PartialMessage<T>): void` | 将 source 合并到 target |
| `fromBinary(data: Uint8Array, options?: Partial<BinaryReadOptions>): T` | 从二进制解析 |
| `toBinary(message: T, options?: Partial<BinaryWriteOptions>): Uint8Array` | 序列化为二进制 |
| `fromJson(json: JsonValue, options?: Partial<JsonReadOptions>): T` | 从 JSON 解析 |
| `toJson(message: T, options?: Partial<JsonWriteOptions>): JsonValue` | 转换为 JSON |

### 4.2 RpcTransport 接口方法

| 方法签名 | 功能说明 |
|---------|---------|
| `mergeOptions(options?: Partial<RpcOptions>): RpcOptions` | 合并默认选项与调用选项 |
| `unary<I, O>(method, input, options): UnaryCall<I, O>` | 执行一元 RPC 调用 |
| `serverStreaming<I, O>(method, input, options): ServerStreamingCall<I, O>` | 执行服务端流调用 |
| `clientStreaming<I, O>(method, options): ClientStreamingCall<I, O>` | 执行客户端流调用 |
| `duplex<I, O>(method, options): DuplexStreamingCall<I, O>` | 执行双向流调用 |

### 4.3 反射操作函数

| 函数名 | 功能说明 |
|--------|---------|
| `reflectionCreate(type: MessageType): unknown` | 创建消息实例 |
| `reflectionMergePartial(type, target, source)` | 合并部分数据 |
| `reflectionEquals(type, a, b): boolean` | 比较两个消息 |
| `ReflectionBinaryReader` | 基于反射的二进制读取器 |
| `ReflectionBinaryWriter` | 基于反射的二进制写入器 |
| `ReflectionJsonReader` | 基于反射的 JSON 读取器 |
| `ReflectionJsonWriter` | 基于反射的 JSON 写入器 |

### 4.4 工具函数

| 函数名 | 功能说明 |
|--------|---------|
| `lowerCamelCase(str: string): string` | 转换为小驼峰命名 |
| `base64encode(bytes: Uint8Array): string` | Base64 编码 |
| `base64decode(str: string): Uint8Array` | Base64 解码 |
| `listEnumValues(enumObj): EnumObjectValue[]` | 获取枚举值列表 |

---

## 5. 依赖关系

### 5.1 模块依赖图

```
@protobuf-ts/plugin
    ├── @protobuf-ts/plugin-framework
    │       └── @protobuf-ts/runtime
    ├── @protobuf-ts/runtime
    ├── @protobuf-ts/runtime-rpc
    │       └── @protobuf-ts/runtime
    └── @protobuf-ts/protoc

@protobuf-ts/grpc-transport
    ├── @protobuf-ts/runtime-rpc
    │       └── @protobuf-ts/runtime
    └── @grpc/grpc-js

@protobuf-ts/grpcweb-transport
    └── @protobuf-ts/runtime-rpc

@protobuf-ts/twirp-transport
    └── @protobuf-ts/runtime-rpc

@protobuf-ts/grpc-backend
    ├── @protobuf-ts/runtime-rpc
    └── @grpc/grpc-js
```

### 5.2 外部依赖

| 依赖 | 用途 | 版本 |
|------|------|------|
| `typescript` | TypeScript 编译器 | >=3.8.3 |
| `@grpc/grpc-js` | gRPC 核心库 | ^1.0 |
| `jasmine` | 测试框架 | ^3.5.0 |
| `karma` | 浏览器测试 | ^6.3.16 |

---

## 6. 项目运行方式

### 6.1 安装与使用

**安装插件**：

```bash
npm install @protobuf-ts/plugin
```

**生成代码**：

```bash
npx protoc --ts_out . --proto_path protos protos/my-message.proto
```

**使用生成的代码**：

```typescript
import { Person } from './my-message';

// 创建消息
let person: Person = {
    name: "John",
    id: 123n,  // bigint
    years: 30
};

// 序列化
let bytes = Person.toBinary(person);

// 反序列化
let decoded = Person.fromBinary(bytes);

// JSON 转换
let json = Person.toJsonString(person);
let fromJson = Person.fromJsonString(json);
```

### 6.2 RPC 调用示例

**创建传输层**：

```typescript
import { GrpcTransport } from "@protobuf-ts/grpc-transport";
import { ServiceClient } from "./my-service.client";

const transport = new GrpcTransport({
    host: "localhost:50051",
    channelCredentials: ChannelCredentials.createInsecure()
});

const client = new ServiceClient(transport);

// 调用服务
const response = await client.myMethod({ request: "data" });
```

**使用 gRPC-web**：

```typescript
import { GrpcWebFetchTransport } from "@protobuf-ts/grpcweb-transport";

const transport = new GrpcWebFetchTransport({
    baseUrl: "http://localhost:8080"
});

const client = new ServiceClient(transport);
```

### 6.3 构建项目

**构建单个包**：

```bash
cd packages/runtime
npm run build
```

**构建所有包**：

```bash
make build
```

**运行测试**：

```bash
cd packages/runtime
npm test
```

### 6.4 目录结构

```
protobuf-ts/
├── packages/
│   ├── runtime/           # 核心运行时
│   ├── runtime-rpc/       # RPC 抽象层
│   ├── plugin/            # protoc 插件
│   ├── plugin-framework/  # 插件框架
│   ├── grpc-transport/    # gRPC 传输
│   ├── grpcweb-transport/ # gRPC-web 传输
│   ├── twirp-transport/   # Twirp 传输
│   ├── grpc-backend/      # gRPC 后端
│   ├── protoc/            # protoc 安装器
│   ├── example-*/         # 示例项目
│   ├── benchmarks/        # 性能基准测试
│   ├── test-conformance/  # 一致性测试
│   └── test-generated/    # 生成代码测试
├── .github/workflows/     # CI 配置
├── lerna.json             # Monorepo 配置
└── Makefile               # 构建脚本
```

---

## 7. 扩展开发

### 7.1 自定义传输层

实现 `RpcTransport` 接口即可创建自定义传输层：

```typescript
class MyTransport implements RpcTransport {
    mergeOptions(options?: Partial<RpcOptions>): RpcOptions {
        return mergeRpcOptions(this.defaultOptions, options);
    }
    
    unary<I, O>(method: MethodInfo<I, O>, input: I, options: RpcOptions): UnaryCall<I, O> {
        // 实现自定义调用逻辑
    }
    
    // ... 实现其他方法
}
```

### 7.2 编写拦截器

```typescript
const loggingInterceptor: RpcInterceptor = {
    interceptUnary(next) {
        return (method, input, options) => {
            console.log(`Calling ${method.name}`);
            const call = next(method, input, options);
            call.response.then(result => {
                console.log(`Result:`, result);
            });
            return call;
        };
    }
};

const transport = new GrpcTransport({/* options */});
const intercepted = stackIntercept(transport, [loggingInterceptor]);
```

---

## 8. 版本信息

当前版本：**2.9.5**

---

## 9. 许可证

- 主代码：Apache-2.0
- 部分第三方代码：BSD-3-Clause

详见项目根目录 [LICENSE](file:///workspace/LICENSE) 文件。