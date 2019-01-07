'use strict';
import $ from 'jquery';
import moment from 'moment-timezone';

$('.favorite-button').each((i, e) => {
  const favoriteButton = $(e);
  favoriteButton.click(() => {
    const userId = favoriteButton.attr('data-user-id');
    const combinationId = favoriteButton.attr('data-combination-id');
    const favorite = parseInt(favoriteButton.attr('data-favorite'));
    const nextFavorite = (favorite + 1) % 2;
    const favoriteCounter = $($('.favorite-counter')[i]);
    
    $.post(`/users/${userId}/combinations/${combinationId}`,
      { favorite: nextFavorite },
      (data) => {
        favoriteButton.attr('data-favorite', data.favorite);
        const favoriteLabels = ['お気に入りに追加', 'お気に入りから削除'];
        favoriteButton.text(favoriteLabels[data.favorite]);
        favoriteCounter.text(data.favoriteCounter);
      }
    );
  });
});

const commentButton = $('#comment-button');
commentButton.click(() => {
  const combinationId = commentButton.attr('data-combination-id');
  const comment = $('textarea[name="comment"]').val();
  const commentCounter = $('.comment-counter');

  if (comment) {
    $.post(`/combinations/${combinationId}/comments`,
      { comment: comment },
      (data) => {
        data.comment.formattedCreatedAt = moment(comment.createdAt).tz('Asia/Tokyo').format('YYYY/MM/DD HH:mm');
        const commentHtml = getCommentHtml(data.comment);
        $(commentHtml).prependTo('#comment-area');
        $('textarea[name="comment"]').val('');
        commentCounter.text(`${data.commentCounter}件のコメント`);
      });
  }


});

const getCommentHtml = (commentObj) => {
  return `
  <div id="${commentObj.commentNumber}" style="position: relative; padding-top: 24px;" >
    <a href="/users/${commentObj.createdBy}/mywords" style="font-size: 80%; position: absolute; top: 0px; left: 0px;">${commentObj.user.username}</a>
    <div style="font-size: 80%; position: absolute; top: 0px; right: 0px;">${commentObj.formattedCreatedAt}</div>
    <div style="width: 95%; white-space: pre-wrap; margin-top: 10px;">${commentObj.comment}</div>
    <button style="position: absolute; top: 34px; right: 0px; " class="btn btn-outline-secondary btn-sm comment-delete-button" data-combination-id="${commentObj.combinationId}" data-comment-number="${commentObj.commentNumber}">削除</button> 
    <hr>
  </div>`;
};

$('#comment-area').on('click', '.comment-delete-button', function() {
  if (confirm('コメントを削除しますか？')) {
    const combinationId = $(this).attr('data-combination-id');
    const commentNumber = $(this).attr('data-comment-number');
    const commentCounter = $('.comment-counter');

    $.post(`/combinations/${combinationId}/comments/${commentNumber}?delete=1`, null,
      (data) => {
        $(`#${commentNumber}`).remove();
        commentCounter.text(`${data.commentCounter}件のコメント`);
      }
    );
  }
});





