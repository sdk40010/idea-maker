'use strict';
import $ from 'jquery';

const favoriteButton = $('.favorite-button');
favoriteButton.click(() => {
  const userId = favoriteButton.data('user-id');
  const combinationId = favoriteButton.data('combination-id');
  const combination = favoriteButton.data('combination');
  const descriptions = favoriteButton.data('descriptions');
  $.post(`/users/${userId}/combinations/${combinationId}`,
    { combination: combination, descriptions: descriptions },
    (data) => {
      alert('お気に入りに追加しました');
    }
  );
});
