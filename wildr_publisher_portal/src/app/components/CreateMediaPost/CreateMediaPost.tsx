'use client';
import {
  Container,
  Text,
  FileInput,
  Label,
  SubmitButton,
} from '@/app/components/CreateMediaPost/CreateMediaPostComponents';
import { ChangeEvent, useState } from 'react';
import { CreateMediaPostTranslations } from '@/app/components/CreateMediaPost/CreateMediaPostLanguages';
import { useAuth } from '@/app/context/AuthContext';

const CreateMediaPost = () => {
  const [file, setFile] = useState<File | null>(null);
  const { language } = useAuth();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };
  return (
    <Container>
      <FileInput
        type="file"
        id="file"
        name="mediaFile"
        onChange={handleChange}
      />
      <Label htmlFor="file">
        <Text>{CreateMediaPostTranslations[language].selectFileMessage}</Text>
      </Label>
      <SubmitButton type="submit">
        {CreateMediaPostTranslations[language].createPostButton}
      </SubmitButton>
    </Container>
  );
};

export default CreateMediaPost;
