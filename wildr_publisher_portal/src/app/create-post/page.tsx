'use client';
import NavBar from '@/app/components/NavBar/NavBar';
import {
  CreatePostContainer,
  CreatePostWrapper,
  PostTypeTab,
  PostTypeWrapper,
  Title,
} from '@/app/create-post/CreatePostComponents';
import CreateTextPost from '@/app/components/CreateTextPost/CreateTextPost';
import CreateMediaPost from '@/app/components/CreateMediaPost/CreateMediaPost';
import PostOptions from '@/app/components/PostOptions/PostOptions';
import { useState } from 'react';
import { createPostTranslations } from '@/app/create-post/CreatePostLanguages';
import { useAuth } from '@/app/context/AuthContext';

interface TextPostData {
  text: string;
}

interface PostOptionsData {
  expirationHourCount: number;
  isAllowedReposts: boolean;
  visibility: string;
  commenterScope: string;
  commenterVisibility: string;
  caption: string;
}
interface PostData {
  textPostData: TextPostData;
  mediaPostData: object;
  postOptionsData: PostOptionsData;
}

const page = () => {
  const { language } = useAuth();
  const [activeTab, setActiveTab] = useState('Media');
  const [postData, setPostData] = useState<PostData>({
    textPostData: {
      text: '',
    },
    mediaPostData: {},
    postOptionsData: {
      expirationHourCount: 0,
      isAllowedReposts: false,
      visibility: 'ALL',
      commenterScope: 'ALL',
      commenterVisibility: 'ALL',
      caption: '',
    },
  });
  const updatePostData = (type: keyof PostData, data: any) => {
    setPostData(prevData => ({
      ...prevData,
      [type]: data,
    }));
  };

  return (
    <>
      <NavBar />
      <CreatePostContainer>
        <Title>{createPostTranslations[language].pageTitle}</Title>
        <PostTypeWrapper>
          <PostTypeTab
            onClick={() => setActiveTab('Media')}
            $activeTab={activeTab === 'Media'}
          >
            {createPostTranslations[language].postTypeMedia}
          </PostTypeTab>
          <PostTypeTab
            onClick={() => setActiveTab('Post')}
            $activeTab={activeTab === 'Post'}
          >
            {createPostTranslations[language].postTypeText}
          </PostTypeTab>
        </PostTypeWrapper>
        <CreatePostWrapper>
          {activeTab === 'Post' ? (
            <CreateTextPost
              postData={postData}
              updatePostData={data => updatePostData('textPostData', data)}
            />
          ) : (
            <CreateMediaPost />
          )}
          <PostOptions
            postData={postData}
            updatePostData={data => updatePostData('postOptionsData', data)}
          />
        </CreatePostWrapper>
      </CreatePostContainer>
    </>
  );
};

export default page;
