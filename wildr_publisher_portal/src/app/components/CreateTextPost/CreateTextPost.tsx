'use client';
import {
  FormWrapper,
  SubmitButton,
  Input,
} from '@/app/components/CreateTextPost/CreateTextPostComponents';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useMutation } from '@apollo/client';
import { CREATE_TEXT_POST } from '@/graphql/queries';
import { DEFAULT_LANGUAGE } from '@/app/utils/constants';
import { CreateTextPostTranslations } from '@/app/components/CreateTextPost/CreateTextPostLanguages';
import { useAuth } from '@/app/context/AuthContext';

// TODO: Add generated types
interface CreateTextPostProps {
  postData: any;
  updatePostData: (data: any) => void;
}

const CreateTextPost: React.FC<CreateTextPostProps> = ({
  updatePostData,
  postData,
}) => {
  const [text, setText] = useState('');
  const [createTextPost] = useMutation(CREATE_TEXT_POST);
  const { language } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    updatePostData({ text });
  };

  const handleSubmitTextPost = async (event: {
    preventDefault: () => void;
  }) => {
    event.preventDefault();
    try {
      await createTextPost({
        variables: dataForPost,
      });
      toast.success(CreateTextPostTranslations[language].postCreateSuccess);
    } catch (error) {
      toast.error(CreateTextPostTranslations[language].postCreateError);
    } finally {
      updatePostData((prevState: any) => ({
        ...prevState,
        textPostData: { text: '' },
      }));
      setText('');
    }
  };
  //TODO: Add caption to correct input
  const dataForPost = {
    input: {
      expirationHourCount: postData.postOptionsData.expirationHourCount,
      commenterScope: postData.postOptionsData.commenterScope,
      visibility: postData.postOptionsData.visibility,
      content: {
        segments: {
          position: 1,
          segmentType: 'TEXT',
        },
        textSegments: {
          position: 1,
          text: {
            chunk: postData.textPostData.text,
            langCode: DEFAULT_LANGUAGE,
            noSpace: true,
          },
        },
      },
    },
  };

  return (
    <FormWrapper onSubmit={handleSubmitTextPost}>
      <Input
        type="text"
        value={text}
        placeholder={CreateTextPostTranslations[language].postTextPlaceholder}
        onChange={handleInputChange}
      />
      <SubmitButton type="submit">
        {CreateTextPostTranslations[language].createPostButton}
      </SubmitButton>
    </FormWrapper>
  );
};
export default CreateTextPost;
