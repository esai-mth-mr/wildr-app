package v1

import (
	"context"
	"io"
	"net/http"

	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"github.com/grpc-ecosystem/grpc-gateway/v2/utilities"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/grpclog"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/proto"
)

// Suppress "imported and not used" errors
var _ codes.Code
var _ io.Reader
var _ status.Status
var _ = runtime.String
var _ = utilities.NewDoubleArray
var _ = metadata.Join

func request_GreeterService_SayHello_0(
	ctx context.Context,
	marshaler runtime.Marshaler,
	client GreeterServiceClient,
	req *http.Request,
	pathParams map[string]string,
) (proto.Message, runtime.ServerMetadata, error) {
	var protoReq SayHelloRequest
	var metadata runtime.ServerMetadata

	newReader, berr := utilities.IOReaderFactory(req.Body)
	if berr != nil {
		return nil, metadata, status.Errorf(codes.InvalidArgument, "%v", berr)
	}
	if err := marshaler.NewDecoder(newReader()).Decode(&protoReq); err != nil && err != io.EOF {
		return nil, metadata, status.Errorf(codes.InvalidArgument, "%v", err)
	}

	msg, err := client.SayHello(
		ctx,
		&protoReq,
		grpc.Header(&metadata.HeaderMD),
		grpc.Trailer(&metadata.TrailerMD),
	)
	return msg, metadata, err

}

func local_request_GreeterService_SayHello_0(
	ctx context.Context,
	marshaler runtime.Marshaler,
	server GreeterServiceServer,
	req *http.Request,
	pathParams map[string]string,
) (proto.Message, runtime.ServerMetadata, error) {
	var protoReq SayHelloRequest
	var metadata runtime.ServerMetadata

	newReader, berr := utilities.IOReaderFactory(req.Body)
	if berr != nil {
		return nil, metadata, status.Errorf(codes.InvalidArgument, "%v", berr)
	}
	if err := marshaler.NewDecoder(newReader()).Decode(&protoReq); err != nil && err != io.EOF {
		return nil, metadata, status.Errorf(codes.InvalidArgument, "%v", err)
	}

	msg, err := server.SayHello(ctx, &protoReq)
	return msg, metadata, err

}

func request_GreeterService_SayStreamHello_0(
	ctx context.Context,
	marshaler runtime.Marshaler,
	client GreeterServiceClient,
	req *http.Request,
	pathParams map[string]string,
) (GreeterService_SayStreamHelloClient, runtime.ServerMetadata, error) {
	var metadata runtime.ServerMetadata
	stream, err := client.SayStreamHello(ctx)
	if err != nil {
		grpclog.Infof("Failed to start streaming: %v", err)
		return nil, metadata, err
	}
	dec := marshaler.NewDecoder(req.Body)
	handleSend := func() error {
		var protoReq SayStreamHelloRequest
		err := dec.Decode(&protoReq)
		if err == io.EOF {
			return err
		}
		if err != nil {
			grpclog.Infof("Failed to decode request: %v", err)
			return err
		}
		if err := stream.Send(&protoReq); err != nil {
			grpclog.Infof("Failed to send request: %v", err)
			return err
		}
		return nil
	}
	go func() {
		for {
			if err := handleSend(); err != nil {
				break
			}
		}
		if err := stream.CloseSend(); err != nil {
			grpclog.Infof("Failed to terminate client stream: %v", err)
		}
	}()
	header, err := stream.Header()
	if err != nil {
		grpclog.Infof("Failed to get header from client: %v", err)
		return nil, metadata, err
	}
	metadata.HeaderMD = header
	return stream, metadata, nil
}

// RegisterGreeterServiceHandlerServer registers the http handlers for service GreeterService to "mux".
// UnaryRPC     :call GreeterServiceServer directly.
// StreamingRPC :currently unsupported pending https://github.com/grpc/grpc-go/issues/906.
// Note that using this registration option will cause many gRPC library features to stop working. Consider using RegisterGreeterServiceHandlerFromEndpoint instead.
func RegisterGreeterServiceHandlerServer(
	ctx context.Context,
	mux *runtime.ServeMux,
	server GreeterServiceServer,
) error {

	mux.Handle(
		"POST",
		pattern_GreeterService_SayHello_0,
		func(w http.ResponseWriter, req *http.Request, pathParams map[string]string) {
			ctx, cancel := context.WithCancel(req.Context())
			defer cancel()
			var stream runtime.ServerTransportStream
			ctx = grpc.NewContextWithServerTransportStream(ctx, &stream)
			inboundMarshaler, outboundMarshaler := runtime.MarshalerForRequest(mux, req)
			var err error
			var annotatedContext context.Context
			annotatedContext, err = runtime.AnnotateIncomingContext(
				ctx,
				mux,
				req,
				"/greet.v1.GreeterService/SayHello",
				runtime.WithHTTPPathPattern("/v1/greet/hello"),
			)
			if err != nil {
				runtime.HTTPError(ctx, mux, outboundMarshaler, w, req, err)
				return
			}
			resp, md, err := local_request_GreeterService_SayHello_0(
				annotatedContext,
				inboundMarshaler,
				server,
				req,
				pathParams,
			)
			md.HeaderMD, md.TrailerMD = metadata.Join(
				md.HeaderMD,
				stream.Header(),
			), metadata.Join(
				md.TrailerMD,
				stream.Trailer(),
			)
			annotatedContext = runtime.NewServerMetadataContext(annotatedContext, md)
			if err != nil {
				runtime.HTTPError(annotatedContext, mux, outboundMarshaler, w, req, err)
				return
			}

			forward_GreeterService_SayHello_0(
				annotatedContext,
				mux,
				outboundMarshaler,
				w,
				req,
				resp,
				mux.GetForwardResponseOptions()...)

		},
	)

	mux.Handle(
		"POST",
		pattern_GreeterService_SayStreamHello_0,
		func(w http.ResponseWriter, req *http.Request, pathParams map[string]string) {
			err := status.Error(
				codes.Unimplemented,
				"streaming calls are not yet supported in the in-process transport",
			)
			_, outboundMarshaler := runtime.MarshalerForRequest(mux, req)
			runtime.HTTPError(ctx, mux, outboundMarshaler, w, req, err)
			return
		},
	)

	return nil
}

// RegisterGreeterServiceHandlerFromEndpoint is same as RegisterGreeterServiceHandler but
// automatically dials to "endpoint" and closes the connection when "ctx" gets done.
func RegisterGreeterServiceHandlerFromEndpoint(
	ctx context.Context,
	mux *runtime.ServeMux,
	endpoint string,
	opts []grpc.DialOption,
) (err error) {
	conn, err := grpc.DialContext(ctx, endpoint, opts...)
	if err != nil {
		return err
	}
	defer func() {
		if err != nil {
			if cerr := conn.Close(); cerr != nil {
				grpclog.Infof("Failed to close conn to %s: %v", endpoint, cerr)
			}
			return
		}
		go func() {
			<-ctx.Done()
			if cerr := conn.Close(); cerr != nil {
				grpclog.Infof("Failed to close conn to %s: %v", endpoint, cerr)
			}
		}()
	}()

	return RegisterGreeterServiceHandler(ctx, mux, conn)
}

// RegisterGreeterServiceHandler registers the http handlers for service GreeterService to "mux".
// The handlers forward requests to the grpc endpoint over "conn".
func RegisterGreeterServiceHandler(
	ctx context.Context,
	mux *runtime.ServeMux,
	conn *grpc.ClientConn,
) error {
	return RegisterGreeterServiceHandlerClient(ctx, mux, NewGreeterServiceClient(conn))
}

// RegisterGreeterServiceHandlerClient registers the http handlers for service GreeterService
// to "mux". The handlers forward requests to the grpc endpoint over the given implementation of "GreeterServiceClient".
// Note: the gRPC framework executes interceptors within the gRPC handler. If the passed in "GreeterServiceClient"
// doesn't go through the normal gRPC flow (creating a gRPC client etc.) then it will be up to the passed in
// "GreeterServiceClient" to call the correct interceptors.
func RegisterGreeterServiceHandlerClient(
	ctx context.Context,
	mux *runtime.ServeMux,
	client GreeterServiceClient,
) error {

	mux.Handle(
		"POST",
		pattern_GreeterService_SayHello_0,
		func(w http.ResponseWriter, req *http.Request, pathParams map[string]string) {
			ctx, cancel := context.WithCancel(req.Context())
			defer cancel()
			inboundMarshaler, outboundMarshaler := runtime.MarshalerForRequest(mux, req)
			var err error
			var annotatedContext context.Context
			annotatedContext, err = runtime.AnnotateContext(
				ctx,
				mux,
				req,
				"/greet.v1.GreeterService/SayHello",
				runtime.WithHTTPPathPattern("/v1/greet/hello"),
			)
			if err != nil {
				runtime.HTTPError(ctx, mux, outboundMarshaler, w, req, err)
				return
			}
			resp, md, err := request_GreeterService_SayHello_0(
				annotatedContext,
				inboundMarshaler,
				client,
				req,
				pathParams,
			)
			annotatedContext = runtime.NewServerMetadataContext(annotatedContext, md)
			if err != nil {
				runtime.HTTPError(annotatedContext, mux, outboundMarshaler, w, req, err)
				return
			}

			forward_GreeterService_SayHello_0(
				annotatedContext,
				mux,
				outboundMarshaler,
				w,
				req,
				resp,
				mux.GetForwardResponseOptions()...)

		},
	)

	mux.Handle(
		"POST",
		pattern_GreeterService_SayStreamHello_0,
		func(w http.ResponseWriter, req *http.Request, pathParams map[string]string) {
			ctx, cancel := context.WithCancel(req.Context())
			defer cancel()
			inboundMarshaler, outboundMarshaler := runtime.MarshalerForRequest(mux, req)
			var err error
			var annotatedContext context.Context
			annotatedContext, err = runtime.AnnotateContext(
				ctx,
				mux,
				req,
				"/greet.v1.GreeterService/SayStreamHello",
				runtime.WithHTTPPathPattern("/v1/greet/hello/stream"),
			)
			if err != nil {
				runtime.HTTPError(ctx, mux, outboundMarshaler, w, req, err)
				return
			}
			resp, md, err := request_GreeterService_SayStreamHello_0(
				annotatedContext,
				inboundMarshaler,
				client,
				req,
				pathParams,
			)
			annotatedContext = runtime.NewServerMetadataContext(annotatedContext, md)
			if err != nil {
				runtime.HTTPError(annotatedContext, mux, outboundMarshaler, w, req, err)
				return
			}

			forward_GreeterService_SayStreamHello_0(
				annotatedContext,
				mux,
				outboundMarshaler,
				w,
				req,
				func() (proto.Message, error) { return resp.Recv() },
				mux.GetForwardResponseOptions()...)

		},
	)

	return nil
}

var (
	pattern_GreeterService_SayHello_0 = runtime.MustPattern(
		runtime.NewPattern(1, []int{2, 0, 2, 1, 2, 2}, []string{"v1", "greet", "hello"}, ""),
	)

	pattern_GreeterService_SayStreamHello_0 = runtime.MustPattern(
		runtime.NewPattern(
			1,
			[]int{2, 0, 2, 1, 2, 2, 2, 3},
			[]string{"v1", "greet", "hello", "stream"},
			"",
		),
	)
)

var (
	forward_GreeterService_SayHello_0 = runtime.ForwardResponseMessage

	forward_GreeterService_SayStreamHello_0 = runtime.ForwardResponseStream
)
