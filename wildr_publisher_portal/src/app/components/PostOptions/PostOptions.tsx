'use client';
import {
  Container,
  SectionTitle,
  FormGroup,
  Label,
  ToggleInput,
  Select,
  TextArea,
  FormGroupCheckbox,
  PostType,
} from '@/app/components/PostOptions/PostOptionsComponents';
import React from 'react';
import { postOptionsTranslations } from '@/app/components/PostOptions/PostOptionsLanguages';
import { useAuth } from '@/app/context/AuthContext';

// TODO: Use generated types
interface PostOptionsProps {
  postData: any;
  updatePostData: (data: any) => void;
}
const PostOptions: React.FC<PostOptionsProps> = ({
  updatePostData,
  postData,
}) => {
  const { language } = useAuth();
  const handlePostTypeChange = () => {
    const newExpirationHourCount =
      postData.postOptionsData.expirationHourCount === 0 ? 24 : 0;
    updatePostData({
      ...postData.postOptionsData,
      expirationHourCount: newExpirationHourCount,
    });
  };
  const handleAllowedRepostsChange = () => {
    updatePostData({
      ...postData.postOptionsData,
      isAllowedReposts: !postData.postOptionsData.isAllowedReposts,
    });
  };
  const handleVisibilityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedVisibility = e.target.value;
    updatePostData({
      ...postData.postOptionsData,
      visibility: selectedVisibility,
    });
  };

  const handleCommenterScopeChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const selectedCommenterScope = e.target.value;
    updatePostData({
      ...postData.postOptionsData,
      commenterScope: selectedCommenterScope,
    });
  };
  const handleCommenterVisibilityChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const selectedCommenterVisibility = e.target.value;
    updatePostData({
      ...postData.postOptionsData,
      commenterVisibility: selectedCommenterVisibility,
    });
  };

  const handleCaption = (e: { target: { value: any } }) => {
    const currentCaption = e.target.value;
    updatePostData({
      ...postData.postOptionsData,
      caption: currentCaption,
    });
  };
  return (
    <Container>
      <SectionTitle>{postOptionsTranslations[language].pageTitle}</SectionTitle>
      <FormGroupCheckbox>
        <Label>
          <PostType>
            {postData.postOptionsData.expirationHourCount === 0
              ? postOptionsTranslations[language].postTypePost
              : postOptionsTranslations[language].postTypeStory}
          </PostType>
        </Label>
        <ToggleInput
          type="checkbox"
          id="toggle-type"
          className="toggle-button"
          onClick={handlePostTypeChange}
        />
      </FormGroupCheckbox>
      <FormGroupCheckbox>
        <Label>{postOptionsTranslations[language].allowRepostLabel}</Label>
        <ToggleInput
          type="checkbox"
          id="toggle-repost"
          className="toggle-button"
          onClick={handleAllowedRepostsChange}
        />
      </FormGroupCheckbox>
      <FormGroup>
        <Label>{postOptionsTranslations[language].seeCommentLabel}</Label>
        <Select onChange={handleVisibilityChange}>
          <option value="ALL">
            {postOptionsTranslations[language].optionsAll}
          </option>
          <option value="FOLLOWERS">
            {postOptionsTranslations[language].optionsFollowers}
          </option>
        </Select>
      </FormGroup>
      <FormGroup>
        <Label>{postOptionsTranslations[language].commentPostLabel}</Label>
        <Select
          onChange={handleCommenterScopeChange}
          disabled={postData.postOptionsData.expirationHourCount === 24}
        >
          <option value="ALL">
            {postOptionsTranslations[language].optionsAll}
          </option>
          <option value="FOLLOWING">
            {postOptionsTranslations[language].optionsFollowers}
          </option>
          <option value="NONE">
            {postOptionsTranslations[language].optionsNone}
          </option>
        </Select>
      </FormGroup>
      <FormGroup>
        <Label>{postOptionsTranslations[language].seeCommentLabel}</Label>
        <Select
          onChange={handleCommenterVisibilityChange}
          disabled={postData.postOptionsData.expirationHourCount === 24}
        >
          <option value="Everyone">
            {postOptionsTranslations[language].optionsAll}
          </option>
          <option value="Author">
            {postOptionsTranslations[language].optionsAuthor}
          </option>
        </Select>
      </FormGroup>
      <FormGroup>
        <Label>Assign to challenge</Label>
        <Select disabled={postData.postOptionsData.expirationHourCount === 24}>
          <option value="None">
            {postOptionsTranslations[language].optionsNone}
          </option>
        </Select>
      </FormGroup>
      {
        // TODO: Clear caption after successful post create
      }
      <TextArea
        value={postData.postOptionsData.caption}
        placeholder={postOptionsTranslations[language].captionPlaceholder}
        maxLength={200}
        onChange={handleCaption}
      />
    </Container>
  );
};
export default PostOptions;
