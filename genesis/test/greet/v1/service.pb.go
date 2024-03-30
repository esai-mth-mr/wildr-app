package v1

import (
	reflect "reflect"
	sync "sync"

	_ "github.com/wildr-inc/app/genesis/test/annotations"
	protoreflect "google.golang.org/protobuf/reflect/protoreflect"
	protoimpl "google.golang.org/protobuf/runtime/protoimpl"
)

const (
	// Verify that this generated code is sufficiently up-to-date.
	_ = protoimpl.EnforceVersion(20 - protoimpl.MinVersion)
	// Verify that runtime/protoimpl is sufficiently up-to-date.
	_ = protoimpl.EnforceVersion(protoimpl.MaxVersion - 20)
)

type SayHelloRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Name string `protobuf:"bytes,1,opt,name=name,proto3" json:"name,omitempty"`
}

func (x *SayHelloRequest) Reset() {
	*x = SayHelloRequest{}
	if protoimpl.UnsafeEnabled {
		mi := &file_greet_v1_service_proto_msgTypes[0]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *SayHelloRequest) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*SayHelloRequest) ProtoMessage() {}

func (x *SayHelloRequest) ProtoReflect() protoreflect.Message {
	mi := &file_greet_v1_service_proto_msgTypes[0]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use SayHelloRequest.ProtoReflect.Descriptor instead.
func (*SayHelloRequest) Descriptor() ([]byte, []int) {
	return file_greet_v1_service_proto_rawDescGZIP(), []int{0}
}

func (x *SayHelloRequest) GetName() string {
	if x != nil {
		return x.Name
	}
	return ""
}

type SayHelloResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Message string `protobuf:"bytes,1,opt,name=message,proto3" json:"message,omitempty"`
}

func (x *SayHelloResponse) Reset() {
	*x = SayHelloResponse{}
	if protoimpl.UnsafeEnabled {
		mi := &file_greet_v1_service_proto_msgTypes[1]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *SayHelloResponse) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*SayHelloResponse) ProtoMessage() {}

func (x *SayHelloResponse) ProtoReflect() protoreflect.Message {
	mi := &file_greet_v1_service_proto_msgTypes[1]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use SayHelloResponse.ProtoReflect.Descriptor instead.
func (*SayHelloResponse) Descriptor() ([]byte, []int) {
	return file_greet_v1_service_proto_rawDescGZIP(), []int{1}
}

func (x *SayHelloResponse) GetMessage() string {
	if x != nil {
		return x.Message
	}
	return ""
}

type SayStreamHelloRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Name string `protobuf:"bytes,1,opt,name=name,proto3" json:"name,omitempty"`
}

func (x *SayStreamHelloRequest) Reset() {
	*x = SayStreamHelloRequest{}
	if protoimpl.UnsafeEnabled {
		mi := &file_greet_v1_service_proto_msgTypes[2]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *SayStreamHelloRequest) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*SayStreamHelloRequest) ProtoMessage() {}

func (x *SayStreamHelloRequest) ProtoReflect() protoreflect.Message {
	mi := &file_greet_v1_service_proto_msgTypes[2]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use SayStreamHelloRequest.ProtoReflect.Descriptor instead.
func (*SayStreamHelloRequest) Descriptor() ([]byte, []int) {
	return file_greet_v1_service_proto_rawDescGZIP(), []int{2}
}

func (x *SayStreamHelloRequest) GetName() string {
	if x != nil {
		return x.Name
	}
	return ""
}

type SayStreamHelloResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Message string `protobuf:"bytes,1,opt,name=message,proto3" json:"message,omitempty"`
}

func (x *SayStreamHelloResponse) Reset() {
	*x = SayStreamHelloResponse{}
	if protoimpl.UnsafeEnabled {
		mi := &file_greet_v1_service_proto_msgTypes[3]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *SayStreamHelloResponse) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*SayStreamHelloResponse) ProtoMessage() {}

func (x *SayStreamHelloResponse) ProtoReflect() protoreflect.Message {
	mi := &file_greet_v1_service_proto_msgTypes[3]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use SayStreamHelloResponse.ProtoReflect.Descriptor instead.
func (*SayStreamHelloResponse) Descriptor() ([]byte, []int) {
	return file_greet_v1_service_proto_rawDescGZIP(), []int{3}
}

func (x *SayStreamHelloResponse) GetMessage() string {
	if x != nil {
		return x.Message
	}
	return ""
}

var File_greet_v1_service_proto protoreflect.FileDescriptor

var file_greet_v1_service_proto_rawDesc = []byte{
	0x0a, 0x16, 0x67, 0x72, 0x65, 0x65, 0x74, 0x2f, 0x76, 0x31, 0x2f, 0x73, 0x65, 0x72, 0x76, 0x69,
	0x63, 0x65, 0x2e, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x12, 0x08, 0x67, 0x72, 0x65, 0x65, 0x74, 0x2e,
	0x76, 0x31, 0x1a, 0x1c, 0x67, 0x6f, 0x6f, 0x67, 0x6c, 0x65, 0x2f, 0x61, 0x70, 0x69, 0x2f, 0x61,
	0x6e, 0x6e, 0x6f, 0x74, 0x61, 0x74, 0x69, 0x6f, 0x6e, 0x73, 0x2e, 0x70, 0x72, 0x6f, 0x74, 0x6f,
	0x22, 0x25, 0x0a, 0x0f, 0x53, 0x61, 0x79, 0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x52, 0x65, 0x71, 0x75,
	0x65, 0x73, 0x74, 0x12, 0x12, 0x0a, 0x04, 0x6e, 0x61, 0x6d, 0x65, 0x18, 0x01, 0x20, 0x01, 0x28,
	0x09, 0x52, 0x04, 0x6e, 0x61, 0x6d, 0x65, 0x22, 0x2c, 0x0a, 0x10, 0x53, 0x61, 0x79, 0x48, 0x65,
	0x6c, 0x6c, 0x6f, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65, 0x12, 0x18, 0x0a, 0x07, 0x6d,
	0x65, 0x73, 0x73, 0x61, 0x67, 0x65, 0x18, 0x01, 0x20, 0x01, 0x28, 0x09, 0x52, 0x07, 0x6d, 0x65,
	0x73, 0x73, 0x61, 0x67, 0x65, 0x22, 0x2b, 0x0a, 0x15, 0x53, 0x61, 0x79, 0x53, 0x74, 0x72, 0x65,
	0x61, 0x6d, 0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x52, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74, 0x12, 0x12,
	0x0a, 0x04, 0x6e, 0x61, 0x6d, 0x65, 0x18, 0x01, 0x20, 0x01, 0x28, 0x09, 0x52, 0x04, 0x6e, 0x61,
	0x6d, 0x65, 0x22, 0x32, 0x0a, 0x16, 0x53, 0x61, 0x79, 0x53, 0x74, 0x72, 0x65, 0x61, 0x6d, 0x48,
	0x65, 0x6c, 0x6c, 0x6f, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65, 0x12, 0x18, 0x0a, 0x07,
	0x6d, 0x65, 0x73, 0x73, 0x61, 0x67, 0x65, 0x18, 0x01, 0x20, 0x01, 0x28, 0x09, 0x52, 0x07, 0x6d,
	0x65, 0x73, 0x73, 0x61, 0x67, 0x65, 0x32, 0xeb, 0x01, 0x0a, 0x0e, 0x47, 0x72, 0x65, 0x65, 0x74,
	0x65, 0x72, 0x53, 0x65, 0x72, 0x76, 0x69, 0x63, 0x65, 0x12, 0x5d, 0x0a, 0x08, 0x53, 0x61, 0x79,
	0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x12, 0x19, 0x2e, 0x67, 0x72, 0x65, 0x65, 0x74, 0x2e, 0x76, 0x31,
	0x2e, 0x53, 0x61, 0x79, 0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x52, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74,
	0x1a, 0x1a, 0x2e, 0x67, 0x72, 0x65, 0x65, 0x74, 0x2e, 0x76, 0x31, 0x2e, 0x53, 0x61, 0x79, 0x48,
	0x65, 0x6c, 0x6c, 0x6f, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65, 0x22, 0x1a, 0x82, 0xd3,
	0xe4, 0x93, 0x02, 0x14, 0x3a, 0x01, 0x2a, 0x22, 0x0f, 0x2f, 0x76, 0x31, 0x2f, 0x67, 0x72, 0x65,
	0x65, 0x74, 0x2f, 0x68, 0x65, 0x6c, 0x6c, 0x6f, 0x12, 0x7a, 0x0a, 0x0e, 0x53, 0x61, 0x79, 0x53,
	0x74, 0x72, 0x65, 0x61, 0x6d, 0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x12, 0x1f, 0x2e, 0x67, 0x72, 0x65,
	0x65, 0x74, 0x2e, 0x76, 0x31, 0x2e, 0x53, 0x61, 0x79, 0x53, 0x74, 0x72, 0x65, 0x61, 0x6d, 0x48,
	0x65, 0x6c, 0x6c, 0x6f, 0x52, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74, 0x1a, 0x20, 0x2e, 0x67, 0x72,
	0x65, 0x65, 0x74, 0x2e, 0x76, 0x31, 0x2e, 0x53, 0x61, 0x79, 0x53, 0x74, 0x72, 0x65, 0x61, 0x6d,
	0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65, 0x22, 0x21, 0x82,
	0xd3, 0xe4, 0x93, 0x02, 0x1b, 0x3a, 0x01, 0x2a, 0x22, 0x16, 0x2f, 0x76, 0x31, 0x2f, 0x67, 0x72,
	0x65, 0x65, 0x74, 0x2f, 0x68, 0x65, 0x6c, 0x6c, 0x6f, 0x2f, 0x73, 0x74, 0x72, 0x65, 0x61, 0x6d,
	0x28, 0x01, 0x30, 0x01, 0x42, 0x33, 0x5a, 0x31, 0x67, 0x69, 0x74, 0x68, 0x75, 0x62, 0x2e, 0x63,
	0x6f, 0x6d, 0x2f, 0x61, 0x6c, 0x65, 0x78, 0x66, 0x61, 0x6c, 0x6b, 0x6f, 0x77, 0x73, 0x6b, 0x69,
	0x2f, 0x67, 0x6f, 0x2d, 0x73, 0x65, 0x72, 0x76, 0x69, 0x63, 0x65, 0x2f, 0x74, 0x65, 0x73, 0x74,
	0x2f, 0x67, 0x72, 0x65, 0x65, 0x74, 0x2f, 0x76, 0x31, 0x62, 0x06, 0x70, 0x72, 0x6f, 0x74, 0x6f,
	0x33,
}

var (
	file_greet_v1_service_proto_rawDescOnce sync.Once
	file_greet_v1_service_proto_rawDescData = file_greet_v1_service_proto_rawDesc
)

func file_greet_v1_service_proto_rawDescGZIP() []byte {
	file_greet_v1_service_proto_rawDescOnce.Do(func() {
		file_greet_v1_service_proto_rawDescData = protoimpl.X.CompressGZIP(
			file_greet_v1_service_proto_rawDescData,
		)
	})
	return file_greet_v1_service_proto_rawDescData
}

var file_greet_v1_service_proto_msgTypes = make([]protoimpl.MessageInfo, 4)
var file_greet_v1_service_proto_goTypes = []interface{}{
	(*SayHelloRequest)(nil),        // 0: greet.v1.SayHelloRequest
	(*SayHelloResponse)(nil),       // 1: greet.v1.SayHelloResponse
	(*SayStreamHelloRequest)(nil),  // 2: greet.v1.SayStreamHelloRequest
	(*SayStreamHelloResponse)(nil), // 3: greet.v1.SayStreamHelloResponse
}
var file_greet_v1_service_proto_depIdxs = []int32{
	0, // 0: greet.v1.GreeterService.SayHello:input_type -> greet.v1.SayHelloRequest
	2, // 1: greet.v1.GreeterService.SayStreamHello:input_type -> greet.v1.SayStreamHelloRequest
	1, // 2: greet.v1.GreeterService.SayHello:output_type -> greet.v1.SayHelloResponse
	3, // 3: greet.v1.GreeterService.SayStreamHello:output_type -> greet.v1.SayStreamHelloResponse
	2, // [2:4] is the sub-list for method output_type
	0, // [0:2] is the sub-list for method input_type
	0, // [0:0] is the sub-list for extension type_name
	0, // [0:0] is the sub-list for extension extendee
	0, // [0:0] is the sub-list for field type_name
}

func init() { file_greet_v1_service_proto_init() }
func file_greet_v1_service_proto_init() {
	if File_greet_v1_service_proto != nil {
		return
	}
	if !protoimpl.UnsafeEnabled {
		file_greet_v1_service_proto_msgTypes[0].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*SayHelloRequest); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_greet_v1_service_proto_msgTypes[1].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*SayHelloResponse); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_greet_v1_service_proto_msgTypes[2].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*SayStreamHelloRequest); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_greet_v1_service_proto_msgTypes[3].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*SayStreamHelloResponse); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
	}
	type x struct{}
	out := protoimpl.TypeBuilder{
		File: protoimpl.DescBuilder{
			GoPackagePath: reflect.TypeOf(x{}).PkgPath(),
			RawDescriptor: file_greet_v1_service_proto_rawDesc,
			NumEnums:      0,
			NumMessages:   4,
			NumExtensions: 0,
			NumServices:   1,
		},
		GoTypes:           file_greet_v1_service_proto_goTypes,
		DependencyIndexes: file_greet_v1_service_proto_depIdxs,
		MessageInfos:      file_greet_v1_service_proto_msgTypes,
	}.Build()
	File_greet_v1_service_proto = out.File
	file_greet_v1_service_proto_rawDesc = nil
	file_greet_v1_service_proto_goTypes = nil
	file_greet_v1_service_proto_depIdxs = nil
}
