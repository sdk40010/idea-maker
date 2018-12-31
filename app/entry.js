'use strict';
import $ from 'jquery';

$('.favorite-button').each((i, e) => {
  const favoriteButton = $(e);



  favoriteButton.click(() => {
    const userId = favoriteButton.attr('data-user-id');
    const combinationId = favoriteButton.attr('data-combination-id');
    const favorite = parseInt(favoriteButton.attr('data-favorite'));
    const nextFavorite = (favorite + 1) % 2;
    
    $.post(`/users/${userId}/combinations/${combinationId}`,
      { favorite: nextFavorite },
      (data) => {
        favoriteButton.attr('data-favorite', data.favorite);
        const favoriteLabels = ['お気に入りに追加', 'お気に入りから削除'];
        favoriteButton.text(favoriteLabels[data.favorite]);
        commentLink.attr('href', `/combinations/${combinationId}?favorite=${data.favorite}`);
        if (data.favorite === 0) {
          alert('お気に入りから削除しました');
        } else {
          alert('お気に入りに追加しました');
        }
      }
    );
  });
});

