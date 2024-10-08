package v1

import (
	context "context"

	grpc "google.golang.org/grpc"
	codes "google.golang.org/grpc/codes"
	status "google.golang.org/grpc/status"
)

// This is a compile-time assertion to ensure that this generated file
// is compatible with the grpc package it is being compiled against.
// Requires gRPC-Go v1.32.0 or later.
const _ = grpc.SupportPackageIsVersion7

const (
	GreeterService_SayHello_FullMethodName       = "/greet.v1.GreeterService/SayHello"
	GreeterService_SayStreamHello_FullMethodName = "/greet.v1.GreeterService/SayStreamHello"
)

// GreeterServiceClient is the client API for GreeterService service.
//
// For semantics around ctx use and closing/ending streaming RPCs, please refer to https://pkg.go.dev/google.golang.org/grpc/?tab=doc#ClientConn.NewStream.
type GreeterServiceClient interface {
	SayHello(
		ctx context.Context,
		in *SayHelloRequest,
		opts ...grpc.CallOption,
	) (*SayHelloResponse, error)
	SayStreamHello(
		ctx context.Context,
		opts ...grpc.CallOption,
	) (GreeterService_SayStreamHelloClient, error)
}

type greeterServiceClient struct {
	cc grpc.ClientConnInterface
}

func NewGreeterServiceClient(cc grpc.ClientConnInterface) GreeterServiceClient {
	return &greeterServiceClient{cc}
}

func (c *greeterServiceClient) SayHello(
	ctx context.Context,
	in *SayHelloRequest,
	opts ...grpc.CallOption,
) (*SayHelloResponse, error) {
	out := new(SayHelloResponse)
	err := c.cc.Invoke(ctx, GreeterService_SayHello_FullMethodName, in, out, opts...)
	if err != nil {
		return nil, err
	}
	return out, nil
}

func (c *greeterServiceClient) SayStreamHello(
	ctx context.Context,
	opts ...grpc.CallOption,
) (GreeterService_SayStreamHelloClient, error) {
	stream, err := c.cc.NewStream(
		ctx,
		&GreeterService_ServiceDesc.Streams[0],
		GreeterService_SayStreamHello_FullMethodName,
		opts...)
	if err != nil {
		return nil, err
	}
	x := &greeterServiceSayStreamHelloClient{stream}
	return x, nil
}

type GreeterService_SayStreamHelloClient interface {
	Send(*SayStreamHelloRequest) error
	Recv() (*SayStreamHelloResponse, error)
	grpc.ClientStream
}

type greeterServiceSayStreamHelloClient struct {
	grpc.ClientStream
}

func (x *greeterServiceSayStreamHelloClient) Send(m *SayStreamHelloRequest) error {
	return x.ClientStream.SendMsg(m)
}

func (x *greeterServiceSayStreamHelloClient) Recv() (*SayStreamHelloResponse, error) {
	m := new(SayStreamHelloResponse)
	if err := x.ClientStream.RecvMsg(m); err != nil {
		return nil, err
	}
	return m, nil
}

// GreeterServiceServer is the server API for GreeterService service.
// All implementations must embed UnimplementedGreeterServiceServer
// for forward compatibility
type GreeterServiceServer interface {
	SayHello(context.Context, *SayHelloRequest) (*SayHelloResponse, error)
	SayStreamHello(GreeterService_SayStreamHelloServer) error
	mustEmbedUnimplementedGreeterServiceServer()
}

// UnimplementedGreeterServiceServer must be embedded to have forward compatible implementations.
type UnimplementedGreeterServiceServer struct {
}

func (UnimplementedGreeterServiceServer) SayHello(
	context.Context,
	*SayHelloRequest,
) (*SayHelloResponse, error) {
	return nil, status.Errorf(codes.Unimplemented, "method SayHello not implemented")
}
func (UnimplementedGreeterServiceServer) SayStreamHello(GreeterService_SayStreamHelloServer) error {
	return status.Errorf(codes.Unimplemented, "method SayStreamHello not implemented")
}
func (UnimplementedGreeterServiceServer) mustEmbedUnimplementedGreeterServiceServer() {}

// UnsafeGreeterServiceServer may be embedded to opt out of forward compatibility for this service.
// Use of this interface is not recommended, as added methods to GreeterServiceServer will
// result in compilation errors.
type UnsafeGreeterServiceServer interface {
	mustEmbedUnimplementedGreeterServiceServer()
}

func RegisterGreeterServiceServer(s grpc.ServiceRegistrar, srv GreeterServiceServer) {
	s.RegisterService(&GreeterService_ServiceDesc, srv)
}

func _GreeterService_SayHello_Handler(
	srv interface{},
	ctx context.Context,
	dec func(interface{}) error,
	interceptor grpc.UnaryServerInterceptor,
) (interface{}, error) {
	in := new(SayHelloRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(GreeterServiceServer).SayHello(ctx, in)
	}
	info := &grpc.UnaryServerInfo{
		Server:     srv,
		FullMethod: GreeterService_SayHello_FullMethodName,
	}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(GreeterServiceServer).SayHello(ctx, req.(*SayHelloRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _GreeterService_SayStreamHello_Handler(srv interface{}, stream grpc.ServerStream) error {
	return srv.(GreeterServiceServer).SayStreamHello(&greeterServiceSayStreamHelloServer{stream})
}

type GreeterService_SayStreamHelloServer interface {
	Send(*SayStreamHelloResponse) error
	Recv() (*SayStreamHelloRequest, error)
	grpc.ServerStream
}

type greeterServiceSayStreamHelloServer struct {
	grpc.ServerStream
}

func (x *greeterServiceSayStreamHelloServer) Send(m *SayStreamHelloResponse) error {
	return x.ServerStream.SendMsg(m)
}

func (x *greeterServiceSayStreamHelloServer) Recv() (*SayStreamHelloRequest, error) {
	m := new(SayStreamHelloRequest)
	if err := x.ServerStream.RecvMsg(m); err != nil {
		return nil, err
	}
	return m, nil
}

// GreeterService_ServiceDesc is the grpc.ServiceDesc for GreeterService service.
// It's only intended for direct use with grpc.RegisterService,
// and not to be introspected or modified (even as a copy)
var GreeterService_ServiceDesc = grpc.ServiceDesc{
	ServiceName: "greet.v1.GreeterService",
	HandlerType: (*GreeterServiceServer)(nil),
	Methods: []grpc.MethodDesc{
		{
			MethodName: "SayHello",
			Handler:    _GreeterService_SayHello_Handler,
		},
	},
	Streams: []grpc.StreamDesc{
		{
			StreamName:    "SayStreamHello",
			Handler:       _GreeterService_SayStreamHello_Handler,
			ServerStreams: true,
			ClientStreams: true,
		},
	},
	Metadata: "greet/v1/service.proto",
}
