'use strict';
import $ from 'jquery';

$('.favorite-button').each((i, e) => {
  const favoriteButton = $(e);
  favoriteButton.click(() => {
    const userId = favoriteButton.attr('data-user-id');
    const combinationId = favoriteButton.attr('data-combination-id');
    const favorite = parseInt(favoriteButton.attr('data-favorite'));
    const nextFavorite = (favorite + 1) % 2;
    
    $.post(`/users/${userId}/combinations/${combinationId}/favorites`,
      { favorite: nextFavorite },
      (data) => {
        favoriteButton.attr('data-favorite', data.favorite);
        const favoriteLabels = ['お気に入りに追加', 'お気に入りから削除'];
        favoriteButton.text(favoriteLabels[data.favorite]);
        if (data.favorite === 0) {
          alert('お気に入りから削除しました');
        } else {
          alert('お気に入りに追加しました');
        }
      }
    );
  });
});

const commentButton = $('#comment-button');
commentButton.click(() => {
  const combinationId = commentButton.attr('data-combination-id');
  const comment = $('textarea[name="comment"]').val();

  if (comment) {
    $.post(`/combinations/${combinationId}/comments`,
      { comment: comment },
      (data) => {
        const commentHtml = getNode(data.comment);
        $(commentHtml).prependTo('#comment-area');
      }
    );
  }


});

const getNode = (commentObj) => {
  return `
  <div id = "${commentObj.commentNumber}">
    <div style="font-size: 80%; position: relative; height: 2rem;">
      <a href="/users/${commentObj.createdBy}/mywords" style="position: absolute; left: 0px;"> ${commentObj.user.username} </a>
      <div style="position: absolute; right: 0px;"> ${commentObj.formattedCreatedAt} </div>
    </div>
    <div>
      <p> ${commentObj.comment} </p>
    </div>
    <hr>
  </div>`;
}

